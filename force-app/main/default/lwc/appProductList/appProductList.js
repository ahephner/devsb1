import { LightningElement, api, wire } from 'lwc';
import searchProduct from '@salesforce/apex/appProduct.searchProduct'

const columnsList = [
    {label: 'Name', fieldName:'Product_Name__c'},
    {label: 'Code', fieldName:'Name'},
    {label: 'Status', fieldName:'Product_Status__c'},
    {label: 'Avg Cost', fieldName:'Average_Cost__c'},
]
export default class AppProductList extends LightningElement {
    //api need to be lower case to pass from parent
    // @api searchkey; 
    // @api prodfam; 
    // @api category; 
    loaded = false
    columnsList = columnsList; 
    prod; 
    
    
    @wire(searchProduct)
     wiredProduct({error, data}){
     if(data){
         this.loaded = true; 
         this.prod = data; 
         this.copy = data; 
         console.log(this.prod); 
        }
     }
   
    // @api
    // searchProd(searchKey, prodFam, category){
    //   console.log(searchKey, prodFam, category);
    //       searchKey = searchKey.toLowerCase()
    //         this.prod = this.prod.filter((x)=> {
    //           console.log(1,searchKey);              
    //            x.Product_Name__c.toLowerCase().includes(searchKey)
    //            console.log(x.Product_Name__c.toLowerCase(), typeof x.Product_Name__c);
               
    //       })
          
      
    // }    
     @api
     searchProd(searchKey, pf, cat){
         this.prod = this.copy;
         searchKey = searchKey.toLowerCase();
         if(searchKey === '' && pf === 'All' && cat ==='All'){
            this.prod = this.copy;
         }else if(searchKey != '' && pf === 'All' && cat ==='All'){
         this.prod = this.prod.filter(x=> x.Product_Name__c.toLowerCase().includes(searchKey) || x.Name.toLowerCase().includes(searchKey))
         }else if(searchKey === '' && pf != 'All' || cat != 'All'){
             this.prod = this.prod.filter(x => x.Product_Family__c === pf || x.Subcategory__c === cat)
         }   
        }
  
}