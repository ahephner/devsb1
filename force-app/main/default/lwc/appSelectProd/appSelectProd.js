//go to https://github.com/ahephner/lwc_Comm_Examples/tree/main/dataTableExample for more dataTable example stuff like buttons mapping data

import { LightningElement, api, wire, track } from 'lwc';
import searchProduct from '@salesforce/apex/appProduct.searchProduct'

const columnsList = [
    {type: 'button', 
     initialWidth: 75,typeAttributes:{
        label: 'Add',
        name: 'Add',
        title: 'Add',
        disabled: false,
        value: 'add',
        variant: 'success'
    }, 
    cellAttributes: {
        style: 'transform: scale(0.75)'}
    },
    {label: 'Name', fieldName:'Product_Name__c', cellAttributes:{alignment:'left'}},
    {label: 'Code', fieldName:'Name', cellAttributes:{alignment:'center'}},
    {label: 'Status', fieldName:'Product_Status__c', cellAttributes:{alignment:'center'}},
    {label: 'Avg Cost', fieldName:'Average_Cost__c', 
    type:'currency', cellAttributes:{alignment:'center'}},
]
export default class AppSelectProd extends LightningElement {
    loaded = false
    columnsList = columnsList; 
    prod; 
    error; 
    //needs to be @track so we can follow reactive properties on an array or obj in childern
    @track selection = [];

    @wire(searchProduct)
     wiredProduct({error, data}){
     if(data){
         this.loaded = true;
         this.prod = data;  
        // this.prod = data.map(item=>{
        //      let selectColor = item.Average_Cost__c < 10 ? 'none':"slds-theme_success"
        //      return  {...item, 'select': false, 'selectColor':selectColor }
        //  }); 
         this.copy = data 
         console.log(1, this.copy); 
        }else{
            this.error = error;
            console.log(JSON.stringify(this.error)); 
        }
     }

     @api
     searchProd(searchKey, pf, cat){
         
         this.prod = this.copy;
         //console.log('==search selection '+ this.selection);
         //this.selectedRows= this.selection; 
         searchKey = searchKey.toLowerCase();
         if(searchKey === '' && pf === 'All' && cat ==='All'){
            this.prod = this.copy;
         }else if(searchKey != '' && pf === 'All' && cat ==='All'){
         this.prod = this.prod.filter(x=> x.Product_Name__c.toLowerCase().includes(searchKey) || x.Name.toLowerCase().includes(searchKey))
         }else if(searchKey === '' && pf != 'All' || cat != 'All'){
             this.prod = this.prod.filter(x => x.Product_Family__c === pf || x.Subcategory__c === cat)
         }   
        }

        handleRowAction(e){
            const rowAction = e.detail.action.name; 
            const rowName = e.detail.row.Product_Name__c;
            const rowId = e.detail.row.Id;
            if(rowAction ==='Add'){
                this.selection = [
                    ...this.selection,{
                        id: rowId,
                        name: rowName
                    }
                ]
                
            }
        }
        handleRemove(x){
            //console.log('connected');
            //const prodId = x.detail;
            console.log('prodId '+ prodId);  
            const index = this.selection.findIndex(item => item.id === prodId);
            //console.log('index '+ index);
            
            this.selection.splice(index, 1);
            //console.log(this.selection);
            
        }
        //control flow here 
        //can't call set here. A set does not evaluate an array of objects like I was thinking it sees
        // {id: 1, name:'AJ'} != {id:1, name:'AJ'} as true
        //then get all the fields need for pricing. 
        next(){
            //this.selection = new Set(this.selection);
            this.selection = this.copy.filter(cItem => this.selection.some(sItem => cItem.Id === sItem.id));
            
            this.dispatchEvent(new CustomEvent('move',{
                detail: this.selection
            }));  
        }

        cancel(){
            this.dispatchEvent(new CustomEvent('close'));
        }


}