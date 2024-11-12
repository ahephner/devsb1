//go to https://github.com/ahephner/lwc_Comm_Examples/tree/main/dataTableExample for more dataTable example stuff like buttons mapping data

import { LightningElement, wire, track, api } from 'lwc';
//import searchProduct from '@salesforce/apex/appProduct.searchProduct'
//import searchProduct from '@salesforce/apex/appProduct.searchProduct2'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import PROD_OBJECT from '@salesforce/schema/Product__c';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import prodFamily from '@salesforce/schema/Product__c.Product_Family__c';

// My Imports

import { spellCheck, programBuilderSearchString, uniqVals, addSingleKey } from 'c/tagHelper';
import { mergePricing } from 'c/internHelper';
import searchTag from '@salesforce/apex/quickPriceSearchTag.cpqSearchTag';
//returns priority pricing
import priorityPrice from '@salesforce/apex/getPriceBooks.priorityBestPrice'; 
const REGEX_SOSL_RESERVED = /(\?|&|\||!|\{|\}|\[|\]|\(|\)|\^|~|\*|:|"|\+|\\)/g;
const REGEX_STOCK_RES = /(stock|sock|limited|limted|lmited|limit|close-out|close out|closeout|close  out|exempt|exmpet|exemept|southern stock|southernstock|southner stock)/g;
const REGEX_COMMA = /(,)/g;
const REGEX_24D = /2,4-D|2 4-d|2, 4-D/gi;
const REGEX_WAREHOUSE = /wh\s*\d\d\d/gi;
const REGEX_WHITESPACE = /\s/g;

// End of My Imports

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
    {label: 'Name', fieldName:'Name', cellAttributes:{alignment:'left'}, "initialWidth": 375},
    {label: 'Code', fieldName:'Code', cellAttributes:{alignment:'center'}, "initialWidth": 134},
    {label: 'Status', fieldName:'Product_Status__c', cellAttributes:{alignment:'center'}, "initialWidth": 78},
    {label: 'Floor', fieldName:'Floor', 
    type:'currency', cellAttributes:{alignment:'center'}, "initialWidth": 120},
    {label: 'Lvl 1', fieldName:'LevelOne', 
    type:'currency', cellAttributes:{alignment:'center'}, "initialWidth": 120},
    {label: 'Lvl 2', fieldName:'LevelTwo', 
    type:'currency', cellAttributes:{alignment:'center'}, "initialWidth": 120}
]
export default class AppSelectProd extends LightningElement {
    @track loaded = false; 
    columnsList = columnsList; 
    @track prod = []; 
    @api pricebookids = [];
    @api appdate; 
    @api custid;  
    error;
    pfOptions;  
    searchKey;
    pf = 'All';
    cat = 'All';
    viewSearch = true; 
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
                //console.log('picklist '+this.pfOptions[1]);
                
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

   
    nameChange(event) {
        this.searchKey = event.target.value.toLowerCase();
        this.startEventListener();
    }
    
    watchKeyDown(event) {
        if (event.key === 'Enter') {
            this.advancedSearch();
        }
    }

      //handle enter key tagged. maybe change to this.searhKey === undefined
      handleKey(event) {
        //console.log('pbIds => ', this.pricebookids)
        if (event.key === 'Enter') {
            this.advancedSearch();
        }
    }

      pfChange(event){
          this.pf = event.detail.value;
          this.search(); 
           
      }
  
      catChange(e){
          this.cat = e.detail.value; 
          this.search(); 
      }

      search() {
        this.advancedSearch();
    }   

      async advancedSearch() {

        this.whSearch = this.template.querySelector('[data-value="searchInput"]').value.trim().toLowerCase().replace(REGEX_WHITESPACE, "").match(REGEX_WAREHOUSE);
        this.stock = this.template.querySelector('[data-value="searchInput"]').value.trim().toLowerCase().match(REGEX_STOCK_RES);
        this.searchTerm = this.template.querySelector('[data-value="searchInput"]').value.toLowerCase().replace(REGEX_24D, '2 4-D')
            .replace(REGEX_COMMA, ' and ').replace(REGEX_SOSL_RESERVED, '?').replace(REGEX_STOCK_RES, '').replace(REGEX_WAREHOUSE, '').trim();
    
        if (this.searchTerm.length < 2) {
            // LIGHTNING ALERT HERE
            return;
        }
    
        let searchRacks;
        let backUpQuery;
        let warehouseCode;
    
        if (this.stock) {
            this.stock = spellCheck(this.stock[0]);
        }
    
        let buildSearchInfo = programBuilderSearchString(this.searchTerm, this.stock, this.whSearch);
        this.searchQuery = buildSearchInfo.builtTerm;
        searchRacks = buildSearchInfo.wareHouseSearch;
        backUpQuery = buildSearchInfo.backUpQuery;
        warehouseCode = buildSearchInfo.warehouseCode;
    
        this.loaded = false;
    
        try {
            let data = await searchTag({ searchKey: this.searchQuery, searchWareHouse: searchRacks, backUpSearch: backUpQuery, warehouseKey: warehouseCode })
            let tags = data.tags !== undefined ? data.tags : [];
            let backUpSearchUsed = data.backUpSearchUsed;
            let pricing = data.pricing;
    
            //console.log('PRICING: ', pricing)
            let once = tags.length > 1 ? await uniqVals(tags) : tags;
            //console.log("ONCE: ", once);
            this.searchSize = once.length;
            
            // Sorting logic here (as in the original advanced search)
    
            let final = mergePricing(once, 'Product__c', pricing, 'Product2Id', 'Level_1_UserView__c');
            final = mergePricing(final, 'Product__c', pricing, 'Product2Id', 'Floor_Margin__c');
            final = mergePricing(final, 'Product__c', pricing, 'Product2Id', 'Level_2_UserView__c');
            final = mergePricing(final, 'Product__c', pricing, 'Product2Id', 'Product_Cost__c');
            final = mergePricing(final, 'Product__c', pricing, 'Product2Id', 'Level_2_Margin__c');
            final = mergePricing(final, 'Product__c', pricing, 'Product2Id', 'Floor_Price__c');
            //console.log("FINAL: ", final)

            this.prod = await final.map((item, index) => ({
                rowLabel: 'Add',
                rowValue: 'Add',
                rowVariant: 'success',
                Name: item.Product_Name__c,
                Code: item.Product_Code__c,
                Product_Status__c: item.Stock_Status__c,
                Floor: item.Floor_Margin__c,
                LevelOne: item.Level_1_UserView__c,
                LevelTwo: item.Level_2_UserView__c,
                Id: item.Product__c,
                Product2Id: item.Product__c,
                Product_Type__c: item.Product__r.Product_Type__c,
                Floor_Price__c: item.Floor_Price__c,
                Level_2_Margin__c: item.Level_2_Margin__c,
                Agency_Product__c: item.Product__r.Agency_Pricing__c,
                Product_Cost__c: item.Product_Cost__c,
                Product_Size__c: item.Product__r.Size__c,
                nVal: item.Product__r.N__c,
                pVal: item.Product__r.P__c,
                kVal: item.Product__r.K__c,
                isFert: item.Product__r.hasFertilizer__c,
                galWeight: item.Product__r.X1_Gallon_Weight__c,
                Product_SDS_Label__c: item.Product__r.Website_Label__c
            }));
    
            if (backUpSearchUsed) {
                let DIDNT_FIND_AT_WAREHOUSE = [{ Id: '1343', Name: `Not yet tagged for ${this.whSearch}, confirm Inventory after Selection` }];
                this.prod = [...DIDNT_FIND_AT_WAREHOUSE, ...this.prod];
            }
    
        } catch (error) {
            console.error(error);
            this.error = error;
        } finally {
            this.loaded = true;
        }

    // Console log the final value of prod
    //console.log('prod array:', this.prod);
    
    }
    handleHistoricData(){
        this.viewSearch = !this.viewSearch ? true:false; 
    }
    viewHistoric(){
        this.viewSearch = false; 
        this.template.querySelector('c-opp-historic').openHistory();
        console.log('open up')
    }

    async handleHistoricProducts(e){
        console.log('app ', e.detail)
        let {
            Id, Name, Product__c, ProductCode, Product_Type__c, floorPrice, unitCost, agency, 
            nVal, pVal, kVal, Product_Size__c, isFert, galWeight, goodPrice, labelURL}= e.detail
            let priceInfo = await priorityPrice({priceBookIds: this.pricebookids, productId: Product__c})

            
            this.selection = [
                ...this.selection,{
                    Id: Product__c,
                    Name: Name,
                    Product__c: Product__c,
                    ProductCode: ProductCode, 
                    Product_Type__c: Product_Type__c,
                    UnitPrice: priceInfo[0].UnitPrice,
                    alt_PBE_Id: priceInfo[0].Id,
                    alt_PB_Name: priceInfo[0].Pricebook2.Name,
                    alt_PB_Id: priceInfo[0].Pricebook2Id,
                    
                    floorPrice: priceInfo[0].Floor_Price__c,
                    
                    unitCost: agency ? '': priceInfo[0].Product_Cost__c,
                    margin: agency ? '' : priceInfo[0].List_Margin_Calculated__c,
                    agency: agency,
                    nVal: nVal,
                    pVal: pVal,
                    kVal: kVal,
                    Product_Size__c: Product_Size__c,
                    isFert: isFert,
                    galWeight: galWeight,
                    goodPrice: goodPrice,
                    title: `Unit Price - Flr $${priceInfo[0].Floor_Price__c}`,
                    labelURL: labelURL
                }
            ]  
    }
   
     doneLoad(){
         window.clearTimeout(this.delay); 
         this.delay = setTimeout(()=>{
             this.loaded = true; 
         },2000)
     }


//Handles adding the products to this.Selection array when the green add button is hit on the product table
    async    handleRowAction(e){            
                const rowAction = e.detail.action.name; 
                const rowName = e.detail.row.Name;
                const rowId = e.detail.row.Id;
                const rowProduct = e.detail.row.Product2Id; 
                const rowProdType = e.detail.row.Product_Type__c;
                const rowLev2 = e.detail.row.Level_2_UserView__c;
                const rowLev1 = e.detail.row.Level_1_UserView__c; 
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
                const ProductCode = e.detail.row.Code; 
                const rowWebSiteURL = e.detail.row.Product_SDS_Label__c
                
                if(rowAction ==='Add'){
                    let index = this.prod.findIndex(x => x.Id === rowId)
                    this.prod[index].rowLabel = 'X';
                    this.prod[index].rowAction = 'remove';
                    this.prod[index].rowVariant = 'destructive'
                    let priceInfo = await priorityPrice({priceBookIds: this.pricebookids, productId: rowProduct})
                    
                    this.selection = [
                        ...this.selection,{
                            Id: rowId,
                            Name: rowName,
                            Product__c: rowProduct,
                            ProductCode: ProductCode, 
                            Product_Type__c: rowProdType,
                            UnitPrice: priceInfo[0].UnitPrice,
                            alt_PBE_Id: priceInfo[0].Id,
                            alt_PB_Name: priceInfo[0].Pricebook2.Name,
                            alt_PB_Id: priceInfo[0].Pricebook2Id,
                            levelTwo: rowLev2,
                            floorPrice: rowFlrPrice,
                            levelOne: rowLev1,
                            unitCost: rowCost,
                            margin: priceInfo[0].List_Margin_Calculated__c,
                            agency: rowAgency,
                            nVal: rowN,
                            pVal: rowP,
                            kVal: rowK,
                            Product_Size__c: rowSize,
                            isFert: fert,
                            galWeight: galWeight,
                            goodPrice: true,
                            title: `Unit Price - Flr $${rowFlrPrice}`,
                            labelURL: rowWebSiteURL
                        }
                    ]  
                    this.prod = [...this.prod]
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