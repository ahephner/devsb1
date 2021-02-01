import { LightningElement, api } from 'lwc';

export default class AppProductList extends LightningElement {
    //api need to be lower case to pass from parent
    @api searchkey; 
    @api prodfam; 
    @api category; 

    @api
    searchProd(){
        console.log('searchkey '+ this.searchkey + ' prodfam '+ this.prodfam + ' category '+ this.category);
        
    }
}