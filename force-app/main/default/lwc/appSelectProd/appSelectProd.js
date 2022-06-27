//go to https://github.com/ahephner/lwc_Comm_Examples/tree/main/dataTableExample for more dataTable example stuff like buttons mapping data

import { LightningElement, wire, track, api } from 'lwc';
//import searchProduct from '@salesforce/apex/appProduct.searchProduct'
import searchProduct from '@salesforce/apex/appProduct.searchProduct2'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import PROD_OBJECT from '@salesforce/schema/Product__c';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import prodFamily from '@salesforce/schema/Product__c.Product_Family__c';

const columnsList = [
    {type: 'button', 
     initialWidth: 75,typeAttributes:{
        label: {fieldName:'rowLabel'},
        name: 'Add',
        title: 'Add',
        disabled: false,
        value: {fieldName: 'rowValue'},
        variant: {fieldName:'rowVariant'}
    }, 
    cellAttributes: {
        style: 'transform: scale(0.75)'}
    },
    {label: 'Name', fieldName:'Name', cellAttributes:{alignment:'left'}, "initialWidth": 418},
    {label: 'Code', fieldName:'Code', cellAttributes:{alignment:'center'}, "initialWidth": 134},
    {label: 'Status', fieldName:'Product_Status__c', cellAttributes:{alignment:'center'}, "initialWidth": 78},
    {label: 'Suggested Price', fieldName:'Price', 
    type:'currency', cellAttributes:{alignment:'center'}, "initialWidth": 194},
]
export default class AppSelectProd extends LightningElement {
    @track loaded = false; 
    columnsList = columnsList; 
    @track prod = []; 
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
       console.log('sk '+this.searchKey); 
        searchProduct({searchKey: this.searchKey, cat: this.cat, family: this.pf })
        .then((result) => {
            this.prod = result.map(item=>{
                let rowLabel = 'Add';
                let rowValue = 'Add'; 
                let rowVariant = 'success';
                let Name = item.Product2.Name;
                let Code = item.Product2.ProductCode;
                let nVal = item.Product2.N__c;
                let pVal = item.Product2.P__c;
                let kVal = item.Product2.K__c;
                let isFert = item.Product2.hasFertilizer__c;
                let galWeight = item.Product2.X1_Gallon_Weight__c;
                let Product_Status__c = item.Product2.Product_Status__c;
                let Price = item.Agency_Product__c ? item.Floor_Price__c : item.Level_2_UserView__c; 
                return {...item, rowLabel, rowValue, rowVariant, Name, Code, Product_Status__c, Price, nVal, pVal, kVal, isFert, galWeight} 

            });
            console.log(JSON.stringify(this.prod))
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
            const rowName = e.detail.row.Name;
            const rowId = e.detail.row.Id;
            const rowProduct = e.detail.row.Product2Id; 
            const rowProdType = e.detail.row.Product_Type__c;
            const rowUnitPrice = e.detail.row.Level_2_UserView__c;
            const rowFlrPrice = e.detail.row.Floor_Price__c; 
            const rowMargin = e.detail.row.Level_2_Margin__c;
            const rowAgency = e.detail.row.Agency_Product__c;
            const rowCost = e.detail.row.Product_Cost__c;
            const rowSize = e.detail.row.Product_Size__c; 
            const rowN = e.detail.row.nVal;
            const rowP = e.detail.row.pVal;
            const rowK = e.detail.row.kVal; 
            const fert = e.detail.row.isFert; 
            const galWeight = e.detail.row.galWeight;
            console.log(e.detail.Product2Id)
            if(rowAction ==='Add'){
                let index = this.prod.findIndex(x => x.Id === rowId)
                this.prod[index].rowLabel = 'X';
                this.prod[index].rowAction = 'remove';
                this.prod[index].rowVariant = 'destructive'
                this.selection = [
                    ...this.selection,{
                        Id: rowId,
                        Name: rowName,
                        Product__c: rowProduct, 
                        Product_Type__c: rowProdType,
                        unitPrice: rowUnitPrice,
                        floorPrice: rowFlrPrice,
                        unitCost: rowCost,
                        margin: rowMargin,
                        agency: rowAgency,
                        nVal: rowN,
                        pVal: rowP,
                        kVal: rowK,
                        size: rowSize,
                        isFert: fert,
                        galWeight: galWeight
                    }
                ]  
                this.prod = [...this.prod]
                console.log({rowProduct})
                console.log(JSON.stringify(this.selection))
            }else if(rowAction==='remove'){
                console.log('remove');
                
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
        @api
        next(){
            //this.selection = new Set(this.selection);
            
            if(this.selection.length < 1){
                this.dispatchEvent(new ShowToastEvent({
                    title: 'No Products Selected',
                    message: 'Please select at least one product',
                    variant: 'error'
                }));
                return false; 
            }else{
            this.loaded = false; 
            //this.selection = this.selection.filter(cItem => this.selection.some(sItem => cItem.Id === sItem.id));
            //console.log(2, JSON.stringify(this.selection))
            this.dispatchEvent(new CustomEvent('move',{
                detail: this.selection
            }));  
            return true; 
        }
        }

        cancel(){
            this.loaded = false; 
            this.dispatchEvent(new CustomEvent('close'));
        }


}