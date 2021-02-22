import { LightningElement } from 'lwc';

export default class AppNameDate extends LightningElement {
    hiddenNumberBox = false;
    interval ='1';
    numbApps = 1; 
    //name date vars
    appName;
    appDate;
    //custom insert values; 
    customInsert = false; 
    custNumberApps; 
    custSpreadBetweenApps; 
    custDaysApart

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

//flow
    cancel(){
        // console.log('spread '+ this.custSpreadBetweenApps);
        // console.log('numApps '+ this.custNumberApps);
        // console.log('custTimeApart '+this.custDaysApart);
        this.dispatchEvent(new CustomEvent('cancel'));   
    }

    next(){
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