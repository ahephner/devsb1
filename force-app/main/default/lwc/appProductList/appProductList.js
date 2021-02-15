import { LightningElement, api, wire } from 'lwc';
import searchProduct from '@salesforce/apex/appProduct.searchProduct'

const columnsList = [
    {type: 'button', typeAttributes:{
        label: 'Add',
        name: 'Add',
        title: 'Add',
        disabled: false,
        value: 'add',
        variant: 'neutral'
    }, 
    cellAttributes: {
        class:{fieldName: 'selectColor', 
        style: 'transform: scale(0.75)'}
    }},{type: 'button', typeAttributes:{
        label: 'Remove',
        name: 'Remove',
        title: 'Remove',
        disabled: false,
        value: 'remove',
        variant: 'destructive'
    }, 
    cellAttributes: {
        style: 'transform: scale(0.75); visibility: hidden;'
    }},
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
    pageChanged; 
    startCount = -1; 
    initialLoad = true; 
    pageChanged; 
    @wire(searchProduct)
     wiredProduct({error, data}){
     if(data){
         this.loaded = true; 
         this.prod = data.map(item=>{
             let selectColor = item.Average_Cost__c < 10 ? 'none':"slds-theme_success"
             return  {...item, 'select': false, 'selectColor':selectColor }
         }); 
         this.copy = data; 
         console.log(this.prod); 
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

        rowSelect(e){
            let recId = e.target.name 
            console.log(this.selection.length);
            
            if(this.selection.length>0){
                let x = this.selection.indexOf(recId);
                console.log(x + ' x');
                
                if(x>-1){
                    this.selection.splice(x,1);
                }else{
                    this.selection.push(recId);
                }
            }else{
                this.selection.push(recId);
            }
            console.log(this.selection);
        }
        callRowAction( event ) {  
          
            const recId =  event.detail.row.Id;  
            const actionName = event.detail.action.name;
            let fieldRow = event.detail.row.selectColor;
            if(actionName === 'Add'){
                console.log(fieldRow);
                
                fieldRow = 'slds-theme_success'; 
                this.selection.push(recId); 
                console.log(this.selection);
                console.log(fieldRow);
                

            }else if(actionName === 'Remove'){
                fieldRow = ''; 
                let x = this.selection.indexOf(recId);
                this.selection.splice(x, 1);
                console.log(this.selection); 
                console.log(fieldRow)  
            }
   
        }

    }
        //https://salesforce.stackexchange.com/questions/321827/how-can-i-add-remove-the-checked-attribute-via-lwc-controller-data
        //https://www.linkedin.com/pulse/keep-selected-rows-persistent-lightning-web-component-harsh-patel-