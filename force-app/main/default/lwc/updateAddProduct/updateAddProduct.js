import { LightningElement, api, track, wire } from 'lwc';
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
    {label: 'Name', fieldName:'Name', cellAttributes:{alignment:'left'}},
    {label: 'Code', fieldName:'Code', cellAttributes:{alignment:'center'}},
    {label: 'Status', fieldName:'Product_Status__c', cellAttributes:{alignment:'center'}},
    {label: 'Suggested Price', fieldName:'Price', 
    type:'currency', cellAttributes:{alignment:'center'}},
]
export default class UpdateAddProduct extends LightningElement {
    @api recordId; 
    columns = columnsList
    @track prod = []; 
    loaded
    pfOptions;
    pf = 'All';
    cat = 'All'; 
    searchKey; 
    eventListening = false; 
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
    startEventListener(){
        if(!this.eventListening){
            console.log('listening')
            window.addEventListener('keydown', this.watchKeyDown,{
                once:false,
            }) 
            this.eventListening = true; 
        }

    }
    nameChange(event){
        this.searchKey = event.target.value.toLowerCase();
        this.startEventListener();
      
      }
    pfChange(event){
        this.pf = event.detail.value;
        this.startEventListener();
         
    }

    catChange(e){
        this.cat = e.detail.value;
        this.startEventListener(); 
    }
    watchKeyDown(event){
        if(event.key==='Enter'){
            this.search(); 
        }
        
    }
    search(){
        this.loaded = false; 
       console.log('sk '+this.searchKey, 'pf '+this.pf, ' cat '+this.cat); 
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
                let kVale = item.Product2.K__c;
                let Product_Status__c = item.Product2.Product_Status__c;
                let Price = item.Agency_Product__c ? item.Floor_Price__c : item.Level_2_UserView__c; 
                return {...item, rowLabel, rowValue, rowVariant, Name, Code, Product_Status__c, Price, nVal, pVal, kVale} 

            });
            
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
}