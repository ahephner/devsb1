import { LightningElement, api } from 'lwc';
import allAppProducts from '@salesforce/apex/appProduct.allAppProducts';
export default class ProductIntelligence extends LightningElement {
    products = [];
    @api recordId; 
    loaded; 
    prodFilterValue;
    productList = [];
    allProds = [];
    displayProds = []; 
    connectedCallback(){
        this.loaded = false
        this.firstLoad(); 
    }

               //for the combo box 
        get unitArea(){
            return [
                {label:'OZ/M', value:'OZ/M'}, 
                {label: 'OZ/Acre', value:'OZ/Acre'},
                {label: 'LB/M', value:'LB/M'},
                {label: 'LB/Acre', value:'LB/Acre'},
                {label:'100 Gal', value:'100 Gal'}
                ];
            }
    async firstLoad(){
        let prodIds = new Set();
        let loadProd = await allAppProducts({rec: this.recordId });
        console.log(2, this.recordId)
        console.log(3, loadProd)
        this.products = loadProd.map(item=>{
            let name = item.Product_Name__c;
            let code = item.Product_Code__c;
            let price = item.Unit_Price__c;
            let margin = item.Margin__c
            let rate = item.Rate2__c;
            let areaName = item.Area__c;
            //let date = this.reverseString()
            let allowEdit = item.Product__r.Agency_Pricing__c;
            let appNameDate = `${item.Application__r.Name} - ${item.Application__r.Date__c}`
            return {...item, name, code, price, appNameDate, areaName, margin, rate, allowEdit}
        })
        let filters = this.buildProdFilter(this.products);
        this.loaded = true; 
    }

    
    buildProdFilter(data){
        console.log(data)
        let initArray= [];
        for(let i = 0; i<data.length; i++){
            let name = data[i].Product_Name__c;
            let id = data[i].Product__c;
            
            let obj = {label:name, value:id}
            initArray.findIndex(x=>x.label === obj.label) === -1 ? initArray.push(obj) : '';
            this.allProds.push(obj)
        }
        
        this.productList = [{label:'Pick Product', value:'Pick Product'}, {label:'search', value:'search'},...initArray];
        this.prodFilterValue = 'Pick Product';  
        
    }
    firstEl
    filterProd(x){
        x.preventDefault();
           let prodFilter = x.target.options.find(opt => opt.value === x.detail.value);
           this.prodFilterValue = prodFilter.value; 
           this.loaded = false; 
          
           this.displayProds = this.products.filter(x=> x.Product__c === this.prodFilterValue).sort((a,b)=>a.Application__r.Date__c.localeCompare(b.Application__r.Date__c))
           //need a function to destructure first value and get averages
           this.firstEl = this.displayProds[0].name
           this.loaded = true; 
        }
//track saves
//track cancels
    handleUpdates(){

    }
}