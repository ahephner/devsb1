import { LightningElement } from 'lwc';
//this is an example script of formating javascript dates 
export default class DateExamples extends LightningElement {
    customInsert = false; 
    custNumberApps; 
    custSpreadBetweenApps; 
    custDaysApart
    showPreview = false; 
    preview;
    dateFormat = (appDate) => {
        //console.log('appDate '+appDate);
        const app = appDate; 

        const months =['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug','Sep','Oct','Nov', 'Dec'];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const year = app.getFullYear();
        const date = app.getDate();
        const monthName = months[app.getMonth()];
        const dayName = days[app.getDay()];
        const formated = `${dayName}, ${date} ${monthName} ${year}`
        //console.log('form ' +formated);
        return formated;
    }

    buildPreview = (firstDate, repeats, timeBetween, totalApp)=>{
        const d = new Date(firstDate);
         
         const nxt = (repeats * timeBetween)+1
         const left = Number(totalApp)-1;
         const total = Number(totalApp)+1;  
         let mult = 0;
        for (let i = 0; i< repeats; i++){
             let nxt = (i * timeBetween)
             d.setDate(d.getDate() + nxt)
             let day = this.dateFormat(d);
             let appDate = {id:mult, name: day}
             mult ++; 
             console.log('appDate '+day);
             this.dateRange.push(appDate);
        }
        const message = `The first app is on ${firstDate} `+
        `the next app will be ${nxt} days`+
        `and I will make ${left} more applications similar spaced. `+
        `There will be a total of ${total} created. Remember you can always edit dates after inserting!`
  //here is you can return multiple values. 
  //look at the handlePreview to see how to ref them
        return [message, dateRange]; 
    }
    handlePreview(){
        this.showPreview = true;
       var call = this.buildPreview(this.appDate,this.custSpreadBetweenApps,this.custDaysApart, this.custNumberApps );
       //this.buildPreview(this.appDate,this.custSpreadBetweenApps,this.custDaysApart, this.custNumberApps );
        this.preview = call[0];
        this.dates = call.splice(1);
    }
}

//working on updating custom list this is for repli.it testing
// dateFormat = (appDate) => {
//       const app = new Date(appDate);
//       const months =['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug','Sep','Oct','Nov', 'Dec'];
//       const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//       const year = app.getFullYear();
//       const date = app.getDate();
//       const monthName = months[app.getMonth()];
//       const dayName = days[app.getDay()];
//       const formated = `${dayName}, ${date} ${monthName} ${year}`
//       //console.log('form ' +formated);
//       return formated; 
//     }
//     preview = (firstDate, repeats, timeBetween, totalApp)=>{
//      
//       const d = new Date(firstDate);
//       firstDate = dateFormat(firstDate)
//       const x = repeats * timeBetween;
//       
//         d.setDate(d.getDate()+ x)
//       const back = dateFormat(d);
//       const text = [{id:1,name:'a'}, {id:2,name:'b'}]
//       const left = totalApp -1
//       const message = `Your first app will be ${text[0].id} `+
//                       `and the next app will be ${back} ` +
//                       `and there will be ${left} number of apps left.`
//       return [message, 
//              'item 1',
//              'item 2'];
//     }
//     take2 = (firstDate, repeats, timeBetween, totalApp) =>{
//              const d = new Date(firstDate);
//              const dateRange = [];
//              const left = Number(repeats)-1; 
//             for (let i = 0; i< repeats; i++){
//                  let mult = 0;
//                  let nxt = (i * timeBetween)
//                  d.setDate(d.getDate() + nxt)
//                  let appDate = {id:mult, name: dateFormat(d)}
//                  mult ++; 
//               dateRange.push(appDate);
//             }        
//               const message = `Your first app will be ${dateRange[0].name} `+
//                       `and the next app will be ${dateRange[1].name} ` +
//                       `and there will be ${left} number of apps left.`
//       return[message, dateRange]
//     }
//     const x = preview('2021-04-01', 3, 1, 3);  
//     const y = take2('2021-04-01', 3, 7, 3); 
//     console.log(y[0])
//     console.log(y[1])


        //the getDate is pulling in one day behind expected so I am adding a date. 
        //what I am updating from build preview
        // const d = new Date(firstDate);   
        // const first = new Date(firstDate);
        // first.setDate(first.getDate()+ 1);
        // const firstOcc = this.dateFormat(first);  
        // const nxt = (repeats * timeBetween)+1;
        // const left = totalApp -1; 
        // const total = Number(totalApp)+1;  
        // d.setDate(d.getDate() + nxt)
        // const nxtDate = this.dateFormat(d);
        // //const thirdDate = d.setDate(d.getDate()+ (nxt*2));
        // //thirdDate = this.dateFormat(thirdDate); 