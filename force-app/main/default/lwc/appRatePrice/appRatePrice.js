import { LightningElement, api, wire } from 'lwc';
import areaInfo from '@salesforce/apex/appProduct.areaInfo';
export default class AppRatePrice extends LightningElement {
           @api selection; 
           @api areaId; 
           loaded = true; 

           
           newRate(e){
            console.log('newRate '+e.target.name);
            
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