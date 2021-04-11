import axios from "axios"

const baseUrl = 'http://localhost:9200/gitlab-course-40-commit-data-anonymized/_search'

const getAllStudentData = () => {
  const request = axios
    .get(baseUrl, {Accept: 'application/json', 'Content-Type': 'application/json' })
    .then((response) => {
      const allStudentData = [];
      response.data.hits.hits[0]._source.results.forEach(student => {
        const newObj = {username: student.username,
                        student_id: student.student_id,
                        email: student.email,
                        fullname: student.full_name};
        allStudentData.push(newObj)})
        return allStudentData;
      })
      .catch(someError => console.log(someError))
  
      return request;
}

const getData = (studentId) => {

  const CheckCommitDate = (deadline, date) => {
    // if (deadline.getYear() !== date.getYear()){
    //   return deadline.getYear() > date.getYear() ? "EARLY" : "LATE";
    // }
    // else if (deadline.getMonth() !== date.getMonth()) {
    //   return deadline.getMonth() > date.getMonth() ? "EARLY" : "LATE";
    // }
    // else {
    //   if (deadline.getDate() - date.getDate() === 1) {
    //     return "IN-TIME";
    //   }
    //   else {
    //     return deadline.getDate() - date.getDate() > 1 ? "EARLY" : "LATE";
    //   }
    // }
    console.log("a", deadline, "b" , date)
    if (deadline - date === 1) return "IN-TIME"
    if (deadline - date > 1) return "EARLY"
    if (deadline - date < 1) return "LATE"
  }
  // / (1000*60*60*24)
  const getNumberOfDay = (date) => Math.round(date.getTime() / (1000*60*60*24));

  const request = axios
    .get(baseUrl, {Accept: 'application/json', 'Content-Type': 'application/json' })
    .then((response) => {
      const studentData = response.data.hits.hits[0]._source.results.find(student => student.student_id === studentId);
      const commitData = [];
      const WEEKLY_DEADLINE = {};
      const NUMBER_OF_WEEK = 14;

      if (studentData) {
        studentData.commits.forEach(module => {
          module.projects.forEach(project => {
            project.commit_meta.forEach(commit => {

              const commitDate = new Date(commit.commit_date);
              commitDate.setHours(0,0,0,0)
              if (Object.keys(WEEKLY_DEADLINE).length === 0) {
                let deadlDate = new Date(commitDate);
                while (deadlDate.getDay() !== 1) {
                  deadlDate.setDate(deadlDate.getDate() - 1);
                }
                deadlDate.setHours(0,0,0,0);
                WEEKLY_DEADLINE["start-date"] = deadlDate;
                let endDate = new Date(WEEKLY_DEADLINE["start-date"])
                endDate.setDate(endDate.getDate() + 7*NUMBER_OF_WEEK)
                WEEKLY_DEADLINE["end-date"] = endDate;
              } 
              if (!Object.keys(WEEKLY_DEADLINE).includes(module.module_name)) {
                let newDeadl = new Date(WEEKLY_DEADLINE["start-date"]);
                // console.log(newDeadl)
                while (Object.keys(WEEKLY_DEADLINE).find(item => getNumberOfDay(WEEKLY_DEADLINE[item]) === getNumberOfDay(newDeadl))) {
                  newDeadl.setDate(newDeadl.getDate() + 7);
                  newDeadl.setHours(0,0,0,0)
                }
                // newDeadl.setDate(newDeadl.getDate() + 7);
                // newDeadl.setHours(0,0,0,0)
                WEEKLY_DEADLINE[module.module_name] = newDeadl;
              }
              let initialDate = new Date(WEEKLY_DEADLINE["start-date"]);
              while (commitData.length < 98) {
                if (!commitData.map(item => item.dateInSecond).includes(getNumberOfDay(initialDate))) {
                  let newObj = {
                    dateInSecond: getNumberOfDay(initialDate),
                    earlyCommit: 0,
                    inTimeCommit: 0,
                    lateCommit: 0
                  };
                  commitData.push(newObj)
                  initialDate.setDate(initialDate.getDate() + 1)
                  // console.log(getNumberOfDay(initialDate))
                }
              }
              const moduleDeadline = WEEKLY_DEADLINE[module.module_name];
              // console.log(WEEKLY_DEADLINE)
              // console.log("a" ,moduleDeadline, "b", commitDate)
              const datecheck = CheckCommitDate(getNumberOfDay(moduleDeadline), getNumberOfDay(commitDate));
              let singleDate = commitData.find(item => item.dateInSecond === getNumberOfDay(commitDate));
              // if (!singleDate) {
              //   let newObj = {
              //     date: commitDate,
              //     dateInSecond: getNumberOfDay(commitDate),
              //     earlyCommit: 0,
              //     inTimeCommit: 0,
              //     lateCommit: 0
              //   };
              //   if (datecheck === "EARLY") {
              //     newObj = {...newObj, earlyCommit: 1};
              //   } else if (datecheck === "IN-TIME") {
              //     newObj = {...newObj, inTimeCommit: 1};
              //   } else if (datecheck === "LATE"){
              //     newObj = {...newObj, lateCommit: 1};
              //   }
              //   commitData.push(newObj)
              // } else {
                if (singleDate) {
                  if (datecheck === "EARLY") {
                    singleDate.earlyCommit += 1;
                  } else if (datecheck === "IN-TIME") {
                    singleDate.inTimeCommit += 1;
                  } else if (datecheck === "LATE"){
                    singleDate.lateCommit += 1;
                  }
              }
            })
          })
        })
      }
      // console.log(commitData)
      return [commitData,[getNumberOfDay(WEEKLY_DEADLINE["start-date"]), getNumberOfDay(WEEKLY_DEADLINE["end-date"])]];
    })
    .catch(someError => console.log(someError))

    return request;
  }

export default {getData, getAllStudentData};