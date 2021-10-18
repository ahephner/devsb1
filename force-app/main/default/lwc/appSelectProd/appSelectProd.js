//go to https://github.com/ahephner/lwc_Comm_Examples/tree/main/dataTableExample for more dataTable example stuff like buttons mapping data

import { LightningElement, wire, track } from 'lwc';
import searchProduct from '@salesforce/apex/appProduct.searchProduct'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import PROD_OBJECT from '@salesforce/schema/Product__c';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import prodFamily from '@salesforce/schema/Product__c.Product_Family__c';

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
    pfOptions;  
    searchKey;
    pf = 'All';
    cat = 'All';
    //needs to be @track so we can follow reactive properties on an array or obj in childern
    @track selection = [];
    connectedCallback(){
        this.loaded = true; 
    }
    //get set new product family/category search
  @wire(getObjectInfo,{objectApiName: PROD_OBJECT})
        prodInfo
    @wire(getPicklistValues,
        {
            recordTypeId: '$prodInfo.data.defaultRecordTypeId',
            fieldApiName: prodFamily
        })
        wiredPickListValues({data, error}){
            if(data){
                this.pfOptions = data.values;
                console.log('picklist '+this.pfOptions[1]);
                
            }else if(error){
                console.log(error)
            }
        }
        
    get catOptions(){
        return [
            {label: 'All', value: 'All'}, 
            {label: 'Herbicide', value:'Chemicals-Herbicide'},
            {label: 'Fungicide', value:'Chemicals-Fungicide'},
            {label: 'Insecticide', value:'Chemicals-Insecticide'},
            {label: 'PGR', value:'Chemicals-Growth Regulator'},
            {label: 'Granular Pre-emerge', value:'Granular Pre-emergents'}, 
            {label: 'Foliar & Soluble', value: 'Foliar & Soluble'}
        ]
    }

   
    nameChange(event){
        this.searchKey = event.target.value.toLowerCase();
        console.log(this.FAMILYOPTIONS);
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
          console.log(this.pf);
           
      }
  
      catChange(e){
          this.cat = e.detail.value; 
      }

      search(){
        this.loaded = false; 
       
        searchProduct({searchKey: this.searchKey, cat: this.cat, family: this.pf })
        .then((result) => {
            this.prod = result;
            this.error = undefined;
        })
        .catch((error) => {
            this.error = error;
            console.log(this.error);
            
        })
        .finally(() => {
            this.searchKey = undefined; 
            this.loaded = true; 
        })
        
      }
   
     doneLoad(){
         window.clearTimeout(this.delay); 
         this.delay = setTimeout(()=>{
             this.loaded = true; 
         },2000)
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