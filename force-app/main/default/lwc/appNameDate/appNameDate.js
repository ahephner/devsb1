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
    nxt;
    total;
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

    //this is the function that returns the preview string; 
    //note not great programing but it works....
buildPreview = (firstDate, repeats, timeBetween, totalApp)=>{
    const d = new Date(firstDate);
    this.dateRange = [{id:0, name:firstDate}];
     console.log('timeBetween '+timeBetween);
     
     this.nxt = (repeats * timeBetween)
     const left = Number(totalApp)-1;
      this.total = Number(totalApp)+1;  
     var mult = 1;
    for (let i = 1; i<= totalApp; i++){
         d.setDate(d.getDate() + this.nxt)
         let day = new Date(d); 
         console.log('day '+d);
         
         this.dateRange=[
            ...this.dateRange,{
               id:mult, name:day
            }
        ]
         mult ++; 
         

    }  

    return this.dateRange
}
    //this shows preview
    handlePreview(){
        this.showPreview = true;
        this.buildPreview(this.appDate,this.custSpreadBetweenApps,this.custDaysApart, this.custNumberApps );
        //this is when I was returning multiple values
        // var call = this.buildPreview(this.appDate,this.custSpreadBetweenApps,this.custDaysApart, this.custNumberApps );
        // this.preview = call[0];
        // this.dates = call.splice(1);

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

// buildPreview = (firstDate, repeats, timeBetween, totalApp)=>{
//     this.dateRange = [];
//     const d = new Date(firstDate);
//      console.log('timeBetween '+timeBetween);
     
//      this.nxt = (repeats * timeBetween)
//      const left = Number(totalApp)-1;
//       this.total = Number(totalApp)+1;  
//      var mult = 0;
//     for (let i = 0; i<= totalApp; i++){
//          let nxt =  Number(i*timeBetween)
//          console.log('nxt ' +nxt)
//          console.log('date '+d);
         
//          d.setDate(d.getDate() + nxt)
//          let day = new Date(d); 
//          console.log('day '+d);
         
//          this.dateRange=[
//             ...this.dateRange,{
//                id:mult, name:day
//             }
//         ]
//          mult ++; 
         

//     }  

//     return this.dateRange
// }