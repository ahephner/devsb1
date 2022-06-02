import { LightningElement, api } from 'lwc';

export default class AppSelectedProd extends LightningElement {
    @api
    selection;
    prodSelected = true;
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
//    renderedCallback(){
//     console.log(this.selection.length)
//     //    if(this.selection.length > 1){
//     //        this.prodSelected =true;
//     //    }else{
//     //        this.prodSelected = false; 
//     //    }
//    }
        removeProd(x){
            let xId = x.target.name; 
            this.dispatchEvent(new CustomEvent('update', {
                detail: xId
            })); 
            console.log('selected id '+ xId);
            
        }
}