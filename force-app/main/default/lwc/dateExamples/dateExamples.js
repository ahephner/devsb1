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
        const message = `The first app is on ${this.dateRange[0].name} `+
        `the next app will be ${nxt} days after on ${this.dateRange[1].name} `+
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