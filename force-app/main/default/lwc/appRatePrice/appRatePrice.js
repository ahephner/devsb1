import { LightningElement, api, track } from 'lwc';
export default class AppRatePrice extends LightningElement {
           @track data; 
           @api areaSize; 
           loaded = true; 
           
           @api 
           get selection(){
            return this.data;
           }
           //need to make this private so we can edit this
           set selection(value){
               this.data = JSON.parse(JSON.stringify(value)); 
                console.log(this.areaSize);
                
           }
//this will set the number of required units based on rate. 
           unitsRequired = (uOFM, rate, areaS, unitS) => {
               return uOFM.includes('Acre') ? Math.ceil((((rate/43.56)*areaS))/unitS) : Math.ceil(((rate*areaS)/unitS))
            }

           newRate(e){
            let index = this.data.findIndex(prod => prod.Id === e.target.name);
            
            window.clearTimeout(this.delay);
             // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.delay = setTimeout(()=>{
                this.data[index].Rate2__c = e.detail.value;
                console.log('ua '+this.data[index].Unit_Area__c);
                
                if(this.data[index].Unit_Area__c != '' && this.data[index].Unit_Area__c != null){
                    this.data[index].Units_Required__c = this.unitsRequired(this.data[index].Unit_Area__c, this.data[index].Rate2__c, this.areaSize, this.data[index].Size__c )    
                    this.data[index].Total_Price__c = Number(this.data[index].Units_Required__c * this.data[index].Unit_Price__c).toFixed(2);
                    console.log('info = '+this.data[index].Unit_Area__c, this.data[index].Rate2__c, this.areaSize, this.data[index].Size__c);
                    
                }
                
            },500 ) 
           }
           newPrice(e){
            console.log('newPrice '+e.target.name);
           }
           newMargin(e){
            console.log('newMargin '+e.target.name);
           }

           //for the combo box 
           get unitArea(){
            return [
                {label:'OZ/M', value:'OZ/M'}, 
                {label: 'OZ/Acre', value:'OZ/Acre'},
                {label: 'LB/M', value:'LB/M'},
                {label: 'LB/Acre', value:'LB/Acre'}
            ];
        }
           //flow
           save(){
               this.dispatchEvent(new CustomEvent('next'))   
           }

           cancel(){
               this.dispatchEvent(new CustomEvent('cancel'))
           }
           prodInfo(){
            console.log(this.selection.length);
            console.log('areaSize '+ this.areaSize);
            
            for(let i=0;i<this.selection.length;i++){
                console.log(this.selection[i])

            }
        }
}