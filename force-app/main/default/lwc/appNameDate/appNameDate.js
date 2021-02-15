import { LightningElement } from 'lwc';

export default class AppNameDate extends LightningElement {
    hiddenNumberBox = false;
    numberApps ='1';

    //custom insert values; 
    customInsert = false; 
    custNumberApps; 
    custTotal; 
    custTimeApart


    get numOptions(){
        return [
            {label:'Does Not Repeat', value:'1'},
            {label:'Weekly', value:'7'},
            {label:'Monthly', value:'30'},
            {label: 'Custom', value:'custom'},
        ]
    }


    handleNumchange(event){
        this.numberApps = event.detail.value; 
        console.log(this.numberApps)
        if(this.numberApps != '1' && this.numberApps != 'custom'){
            this.hiddenNumberBox = true;
            this.customInsert = false;             
        }else if(this.numberApps ==='custom'){
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
    this.custNumberApps = event.detail.value; 
}

 //the reason why I subtract by one is that the apex job is getting the original insert so if i wanted 3 apps 
    //and put 3 in I will get 4 apps 3 copies plus original 
    totalApps(event){
        this.custTotal = event.detail.value ;
        console.log(this.total);
        
    }
    number(event){
        this.custTimeApart = event.detail.value;
    }
//flow
    cancel(){
        console.log('cancel...');
        
       this.dispatchEvent(new CustomEvent('cancel'));   
    }

    next(){
        this.dispatchEvent(new CustomEvent('next'))
        
    }
}