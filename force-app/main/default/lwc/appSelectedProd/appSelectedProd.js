import { LightningElement, api } from 'lwc';

export default class AppSelectedProd extends LightningElement {
    @api
    selection;
    //haveProductsToShow = false;  
    
    // get selection(){
    //     return this.selectedProd;
    // }
    // set selection(value){
    //     this.selectedProd = value;
    //     console.log(this.selectedProd);
    //     this.processRecord();
    //     if(this.selectedProd.length>0){
    //         this.haveProductsToShow = true;
    //     }
         
    // } 
    // processRecord(){
    //     console.log('callBack '+ this.selectedProd);
        
    // }

        removeProd(x){
            let xId = x.target.name; 
            this.dispatchEvent(new CustomEvent('update', {
                detail: xId
            })); 
        }
}