import { LightningElement, api, wire } from 'lwc';
export default class AppRatePrice extends LightningElement {
            data; 
           
           loaded = true; 
           
           @api 
           get selection(){
            return this.data;
           }
           //need to make this private so we can edit this
           set selection(value){
               this.data = JSON.parse(JSON.stringify(value)); 
                
           }

           newRate(e){
            let index = this.data.findIndex(prod => prod.Id === e.target.name);
            console.log('area '+this.area);
            window.clearTimeout(this.delay);
             // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.delay = setTimeout(()=>{
                this.data[index].Rate2__c = e.detail.value;
                console.log(this.data[index].Rate2__c);
                
            },500 ) 
           }
           newPrice(e){
            console.log('newPrice '+e.target.name);
           }
           newMargin(e){
            console.log('newMargin '+e.target.name);
           }

           prodInfo(){
               console.log(this.selection.length);
               for(let i=0;i<this.selection.length;i++){
                   console.log(this.selection[i])
               }
           }
           //flow
           save(){
               this.dispatchEvent(new CustomEvent('next'))   
           }

           cancel(){
               this.dispatchEvent(new CustomEvent('cancel'))
           }
}