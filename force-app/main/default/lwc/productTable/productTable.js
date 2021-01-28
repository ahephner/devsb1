import { LightningElement } from 'lwc';

export default class ProductTable extends LightningElement {
    exposed = false;
    searchKey; 

    searchProd(event){
        console.log(event.detail); 
        console.log(event.target.value)
    }

    closeModal(){
        this.exposed = false; 
    }
}
