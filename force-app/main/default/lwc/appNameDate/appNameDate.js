import { LightningElement,track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class AppNameDate extends LightningElement {
    hiddenNumberBox = false;
    interval ='once';
    numbApps = 1; 
    //name date vars
    appName;
    appDate;
    //custom insert values; 
    customInsert = false; 
    custNumberApps; 
    custSpreadBetweenApps; 
    custDaysApart
    showPreview = false; 
    preview;
    //dates;
    @track dateRange = [];  
    get numOptions(){
        return [
            {label:'Does Not Repeat', value: 'once'},
            {label:'Weekly', value:'7'},
            {label:'Monthly', value:'30'},
            {label: 'Custom', value:'custom'},
        ]
    }
//name date setting here

    setName(e){
        this.appName = e.detail.value; 
        
    }

    setDate(e){
        this.appDate = e.detail.value;  
        console.log(typeof this.appDate);
        console.log(this.appDate);
        
        
    }
    handleNewNumbApps(e){
        this.numbApps = e.detail.value; 
    }

    handleNumchange(event){
        this.interval = event.detail.value; 
        console.log(this.interval)
        if(this.interval != 'once' && this.interval != 'custom'){
            this.hiddenNumberBox = true;
            this.customInsert = false;             
        }else if(this.interval ==='custom'){
            this.hiddenNumberBox = false; 
            this.customInsert = true; 
        }else{
            this.hiddenNumberBox = false;
            this.customInsert = false; 
        }
    }

//custom insert

    get custOptions() {
        return [
            { label: 'Day', value: '1' },
            { label: 'Week', value: '7' },
            { label: 'Month', value: '30' },
        ];
    }

handleOption(event){
    this.custDaysApart = event.detail.value; 
}

 //the reason why I subtract by one is that the apex job is getting the original insert so if i wanted 3 apps 
    //and put 3 in I will get 4 apps 3 copies plus original 
    number(event){
        this.custSpreadBetweenApps = event.detail.value;
    }
    totalApps(event){
        this.custNumberApps = event.detail.value;
        
    }
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
    //this is the function that returns the preview string; 
    buildPreview = (firstDate, repeats, timeBetween, totalApp)=>{
        const d = new Date(firstDate);
         
         const nxt = (repeats * timeBetween)+1
         const left = Number(totalApp)-1;
         const total = Number(totalApp)+1;  
         var mult = 0;
        for (let i = 0; i<= repeats; i++){
             let nxt = (i * timeBetween)
             d.setDate(d.getDate() + nxt)
             let day = this.dateFormat(d);
             this.dateRange=[
                ...this.dateRange,{
                   id:mult, name:day
                }
            ]
             mult ++; 
             //console.log('appDate '+day);

        }
        console.log('dateRange');
        console.log(this.dateRange);
        
        
        // const message = `The first app is on ${this.dateRange[0].name} `+
        //                       `the next app will be ${nxt} days after on ${this.dateRange[1].name} `+
        //                       `and I will make ${left} more applications similar spaced. `+
        //                       `There will be a total of ${total} created. Remember you can always edit dates after inserting!`
       // return [message, dateRange]; 
    }
    //this shows preview
    handlePreview(){
        this.showPreview = true;
       //var call = this.buildPreview(this.appDate,this.custSpreadBetweenApps,this.custDaysApart, this.custNumberApps );
       this.buildPreview(this.appDate,this.custSpreadBetweenApps,this.custDaysApart, this.custNumberApps );
        //this.preview = call[0];
        //this.dates = call.splice(1);
    }

//flow
    cancel(){
        // console.log('spread '+ this.custSpreadBetweenApps);
        // console.log('numApps '+ this.custNumberApps);
        // console.log('custTimeApart '+this.custDaysApart);
        this.dispatchEvent(new CustomEvent('cancel'));   
    }
    next(){
        if(this.appName === undefined || this.appName === '' || this.appDate === undefined || this.appDate === ''){
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Enter Name and Date',
                    message: 'Make sure you have a name and date',
                    variant: 'error'
                }));
        }else{
            this.infoIsValid();
        }
    }
    infoIsValid(){
        if(this.interval === 'custom'){
            const spread = this.custSpreadBetweenApps * this.custDaysApart; 
            this.dispatchEvent(new CustomEvent('namedate', {
                detail:{ 
                 name: this.appName,
                 date: this.appDate,
                 spread: spread,
                 numb: this.custNumberApps,
                }
             }));
        }else{
            this.dispatchEvent(new CustomEvent('namedate',{
                detail:{
                        name: this.appName,
                        date: this.appDate,
                        spread: this.interval,
                        numb: this.numbApps
                    }
                }));
        }
        
    }
}

//working on updating custom list
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