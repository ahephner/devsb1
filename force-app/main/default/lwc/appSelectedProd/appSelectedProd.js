import { LightningElement, api } from 'lwc';

export default class AppSelectedProd extends LightningElement {
        selectedProd = [];
        haveProductsToShow = false; 
    @api
        get selection(){
            return this.selectedProd;
        }
        set selection(value){
            this.selectedProd = value;
            if(this.selectedProd.length>0){
                this.haveProductsToShow = true;
            }
             
        }
}