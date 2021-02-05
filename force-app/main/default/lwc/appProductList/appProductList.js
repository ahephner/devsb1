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
    selection = [];
    selectedRows = [];
    allSelection = [];
    newCount; 
    startCount = -1; 
    
    
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
         console.log('==search selection '+ this.selection);
         this.selectedRows= this.selection; 
         searchKey = searchKey.toLowerCase();
         if(searchKey === '' && pf === 'All' && cat ==='All'){
            this.prod = this.copy;
         }else if(searchKey != '' && pf === 'All' && cat ==='All'){
         this.prod = this.prod.filter(x=> x.Product_Name__c.toLowerCase().includes(searchKey) || x.Name.toLowerCase().includes(searchKey))
         }else if(searchKey === '' && pf != 'All' || cat != 'All'){
             this.prod = this.prod.filter(x => x.Product_Family__c === pf || x.Subcategory__c === cat)
         }   
        }

        rowSelect(e){
            
                let sr = e.detail.selectedRows;
                // this.newCount = sr.length - 1; 
                //  console.log('newCount ' + this.newCount);
                 
                // if(this.newCount> this.startCount){
                //     this.selection.push(sr[this.newCount].Id);
                //     this.startCount ++; 
                //     this.selection = [... new Set(this.selection)]
                //     console.log('startCount '+ this.startCount + 'newCount '+ this.newCount);
                //     console.log(this.selection);
                    
                // }else{
                //    let index = this.selection.indexOf(sr[this.newCount].Id)
                //     console.log('index '+ index);
                    
                //     if(index > -1){
                //         this.selection.splice(index,1); 
                //     }
                //     this.selection = [... new Set(this.selection)]
                //     this.startCount -= 1; 
                //     console.log('startCount '+ this.startCount + ' newCount '+ this.newCount);
                //     console.log(this.selection);
                    
                // }
                            
                
              
                let allSelectedRows = this.selection;   
           // adding selected rows to all selected
           
            for(let x=0; x < sr.length; x++){
                    this.selection.push(sr[x].Id); 
                    this.selection = [...new Set(this.selection)]
                    console.log(this.selection);
                    
            }

            this.selection.push(...allSelectedRows);
            console.log(1, this.selection);
            
           this.selection=[...new Set(this.selection)]
            console.log(2, this.selection);
            
        }
    }
    
        //https://www.linkedin.com/pulse/keep-selected-rows-persistent-lightning-web-component-harsh-patel-