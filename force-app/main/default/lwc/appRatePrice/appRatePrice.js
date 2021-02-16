import { LightningElement, api } from 'lwc';

export default class AppRatePrice extends LightningElement {
           @api selection; 
        

           save(){
               console.log('pricerate '+this.selection);
               this.dispatchEvent(new CustomEvent('next'))
               
           }
}