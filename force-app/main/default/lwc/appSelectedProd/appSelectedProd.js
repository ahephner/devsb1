import { LightningElement, api } from 'lwc';

export default class AppSelectedProd extends LightningElement {
    selectedProd;
    haveProductsToShow = false;  
    @api
    get selection(){
        return this.selectedProd;
    }
    set selection(value){
        this.selectedProd = [...value];
        console.log(this.selectedProd);
        
        if(this.selectedProd.length>0){
            this.haveProductsToShow = true;
        }
         
    } 
    connectedCallback(){
        this.selectedProd = Object.assign({}, this.selection)
        console.log('callBack '+ this.selectedProd);
        
    }

        removeProd(x){
            let xId = x.target.name; 
            const index = this.selectedProd.indexOf(xId);
            this.selectedProd.slice(index,1);
            console.log('xId '+ xId);
            
            console.log('index '+ index);
            console.log('sel' + this.selectedProd);
            
            this.dispatchEvent(new CustomEvent('update', {
                detail: xId
            })); 
        }
}