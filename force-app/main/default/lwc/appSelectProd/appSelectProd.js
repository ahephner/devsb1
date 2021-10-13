//go to https://github.com/ahephner/lwc_Comm_Examples/tree/main/dataTableExample for more dataTable example stuff like buttons mapping data

import { LightningElement, wire, track } from 'lwc';
import searchProduct from '@salesforce/apex/appProduct.searchProduct'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
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
    @track loaded = false; 
    columnsList = columnsList; 
    prod; 
    error; 
    searchKey;
    pf = 'All';
    cat = 'All';
    //needs to be @track so we can follow reactive properties on an array or obj in childern
    @track selection = [];
    renderedCallback(){
        console.log('call back');
        
    }
    //get set new product family/category search
    get pfOptions(){
        return [
            {label: 'All', value:'All'}, 
            {label: 'Foliar-Pak', value:'Foliar-Pak'},
            {label: 'BASF', value:'BASF'}
        ]
    }
    get catOptions(){
        return [
            {label: 'All', value: 'All'}, 
            {label: 'Herbicide', value:'Chemicals-Herbicide'},
            {label: 'Fungicide', value:'Chemicals-Fungicide'},
            {label: 'Insecticide', value:'Chemicals-Insecticide'},
            {label: 'PGR', value:'Chemicals-Growth Regulator'}, 
        ]
    }
    nameChange(event){
        this.searchKey = event.target.value.toLowerCase();
        //console.log(this.searchKey);
      }

      //handle enter key tagged. maybe change to this.searhKey === undefined
      handleKey(evt){
          if(!this.searchKey){
              //console.log('sk '+this.searchKey);
              return;
          }
          if(evt.key === 'Enter')
              this.search();  
      }
      pfChange(event){
          this.pf = event.detail.value; 
      }
  
      catChange(e){
          this.cat = e.detail.value; 
      }

    @wire(searchProduct)
     wiredProduct({error, data}){
     if(data){
         console.log('loaded top or wire '+this.loaded);
         
         this.prod = data;  
        // this.prod = data.map(item=>{
        //      let selectColor = item.Average_Cost__c < 10 ? 'none':"slds-theme_success"
        //      return  {...item, 'select': false, 'selectColor':selectColor }
        //  }); 
         this.copy = data  
         this.doneLoad(); 
        }else if(error){
            this.error = error;
            console.log(JSON.stringify(this.error)); 
        }
        
     }
     doneLoad(){
         window.clearTimeout(this.delay); 
         this.delay = setTimeout(()=>{
             this.loaded = true; 
         },2000)
     }
//runs the filter on the product table. Is called from the parent because the inputs are currently on the header. 
//this needs to be removed from teh parent and added to this components markup 
//uses the copy object to update the products shown before the filters are run. To make sure all data is taken into account before narrowing what is shown
     
     search(){
         this.prod = this.copy;
         console.log('==search selection '+ this.pf);
         //this.selectedRows= this.selection; 
         
         if(this.searchKey === '' ||!this.search  && this.pf === 'All' && this.cat ==='All'){
                this.prod = this.copy;
            }else if(this.searchKey != '' && this.pf === 'All' && this.cat ==='All'){
                this.prod = this.prod.filter(x=> x.Product_Name__c.toLowerCase().includes(this.searchKey) || x.Name.toLowerCase().includes(this.searchKey))
            }else if(this.searchKey === '' || this.searchKey === undefined && this.pf != 'All' || this.cat != 'All'){
                this.prod = this.prod.filter(x => x.Product_Family__c === this.pf || x.Subcategory__c === this.cat)
            }   
        }
//Handles adding the products to this.Selection array when the green add button is hit on the product table
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
//This gets updated by the child appSelected with the id of a product that was selected
//it then sets a var as the idea finds the index then removes it from the array
        handleRemove(x){
            //console.log('connected');
            const prodId = x.detail;
            //console.log('prodId '+ prodId);  
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
            if(this.selection.length < 1){
                this.dispatchEvent(new ShowToastEvent({
                    title: 'No Products Selected',
                    message: 'Please select at least one product',
                    variant: 'error'
                }));
            }else{
            this.loaded = false; 
            this.selection = this.copy.filter(cItem => this.selection.some(sItem => cItem.Id === sItem.id));
            
            this.dispatchEvent(new CustomEvent('move',{
                detail: this.selection
            }));  
            
        }
        }

        cancel(){
            this.loaded = false; 
            this.dispatchEvent(new CustomEvent('close'));
        }


}