import { LightningElement, api, track, wire } from 'lwc';
import searchProduct from '@salesforce/apex/appProduct.searchProduct2';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import PROD_OBJECT from '@salesforce/schema/Product__c';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import prodFamily from '@salesforce/schema/Product__c.Product_Family__c';


//this gets the avaliable price books must pass account id
import getPriceBooks from '@salesforce/apex/getPriceBooks.getPriceBookIds';
//this returns either a set of price book id's or array of objects of all the avaliable price books for the account in order of priority. Standard is always there
import { priorityPricing} from 'c/helperOMS';
//priority pricing
import priorityPrice from '@salesforce/apex/getPriceBooks.priorityBestPrice'; 
// New imports
import { spellCheck, programBuilderSearchString, uniqVals, addSingleKey } from 'c/tagHelper';
import { mergePricing } from 'c/internHelper';
import searchTag from '@salesforce/apex/quickPriceSearchTag.cpqSearchTag';

const REGEX_SOSL_RESERVED = /(\?|&|\||!|\{|\}|\[|\]|\(|\)|\^|~|\*|:|"|\+|\\)/g;
const REGEX_STOCK_RES = /(stock|sock|limited|limted|lmited|limit|close-out|close out|closeout|close  out|exempt|exmpet|exemept|southern stock|southernstock|southner stock)/g;
const REGEX_COMMA = /(,)/g;
const REGEX_24D = /2,4-D|2 4-d|2, 4-D/gi;
const REGEX_WAREHOUSE = /wh\s*\d\d\d/gi;
const REGEX_WHITESPACE = /\s/g;

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
];

export default class UpdateAddProduct extends LightningElement {
    @api recordId; 
    @api accid; 
    columns = columnsList;
    @track prod = []; 
    loaded;
    pfOptions;
    pf = 'All';
    cat = 'All'; 
    searchKey; 
    eventListening = false; 
    pbIds; 

    connectedCallback() {
        //fire function to get price books 
       
        this.loaded = true; 
    }
    @wire(getPriceBooks,{accountId: '$accid'})
        wiredBooks({data,error}){
            if(data){
                this.pbids = [...priorityPricing(data).priceBookIdArray];
                //console.log('pbids =>',this.pbids)
            }else if(error){
                console.error(error)
            }
        }
    @wire(getObjectInfo, {objectApiName: PROD_OBJECT})
    prodInfo;

    @wire(getPicklistValues, {
        recordTypeId: '$prodInfo.data.defaultRecordTypeId',
        fieldApiName: prodFamily
    })
    wiredPickListValues({data, error}) {
        if (data) {
            this.pfOptions = data.values;
        } else if (error) {
            console.log(error);
        }
    }

    get catOptions() {
        return [
            {label: 'All', value: 'All'}, 
            {label: 'Herbicide', value:'Chemicals-Herbicide'},
            {label: 'Fungicide', value:'Chemicals-Fungicide'},
            {label: 'Insecticide', value:'Chemicals-Insecticide'},
            {label: 'PGR', value:'Chemicals-Growth Regulator'},
            {label: 'Granular Pre-emerge', value:'Granular Pre-emergents'}, 
            {label: 'Foliar & Soluble', value: 'Foliar & Soluble'}
        ];
    }

    startEventListener() {
        if (!this.eventListening) {
            window.addEventListener('keydown', this.watchKeyDown, {
                once: false,
            });
            this.eventListening = true; 
        }
    }

    nameChange(event) {
        this.searchKey = event.target.value.toLowerCase();
        this.startEventListener();
    }

    pfChange(event) {
        this.pf = event.detail.value;
        this.advancedSearch();
    }

    catChange(e) {
        this.cat = e.detail.value;
        this.advancedSearch();
    }

    watchKeyDown(event) {
        if (event.key === 'Enter') {
            this.advancedSearch();
        }
    }

    closeAdd() {
        this.dispatchEvent(new CustomEvent('done'));
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
    console.log(buildSearchInfo)
        this.loaded = false;
    
        try {
            let data = await searchTag({ searchKey: this.searchQuery, searchWareHouse: searchRacks, backUpSearch: backUpQuery, warehouseKey: warehouseCode });
            let tags = data.tags !== undefined ? data.tags : [];
            let backUpSearchUsed = data.backUpSearchUsed;
            let pricing = data.pricing;
    
            let once = tags.length > 1 ? await uniqVals(tags) : tags;
            this.searchSize = once.length;
            
            let final = mergePricing(once, 'Product__c', pricing, 'Product2Id', 'Level_1_UserView__c');
            final = mergePricing(final, 'Product__c', pricing, 'Product2Id', 'Floor_Margin__c');
            final = mergePricing(final, 'Product__c', pricing, 'Product2Id', 'Level_2_UserView__c');
            final = mergePricing(final, 'Product__c', pricing, 'Product2Id', 'Product_Cost__c');
            final = mergePricing(final, 'Product__c', pricing, 'Product2Id', 'Level_2_Margin__c');
            final = mergePricing(final, 'Product__c', pricing, 'Product2Id', 'Floor_Price__c');
    
            this.prod = await final.map((item, index) => ({
                rowLabel: 'Add',
                rowValue: 'Add',
                rowVariant: 'success',
                Name: item.Product_Name__c,
                Code: item.Product_Code__c,
                Product_Status__c: item.Stock_Status__c,
                Price: item.Agency_Product__c ? item.Floor_Margin__c : item.Level_2_UserView__c,
                Id: item.Product__c,
                Product2Id: item.Product__c,
                Product_Type__c: item.Product__r.Product_Type__c,
                Website_Label__c: item.Product__r.Website_Label__c,
                Floor_Price__c: item.Floor_Margin__c,
                Level_2_Margin__c: item.Level_2_Margin__c,
                Agency_Product__c: item.Agency_Product__c,
                Product_Cost__c: item.Product_Cost__c,
                Product_Size__c: item.Product_Size__c,
                nVal: item.N__c,
                pVal: item.P__c,
                kVal: item.K__c,
                isFert: item.hasFertilizer__c,
                galWeight: item.X1_Gallon_Weight__c
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
    }

    // search(){
    //     this.loaded = false; 
    //    //console.log('sk '+this.searchKey, 'pf '+this.pf, ' cat '+this.cat); 
    //     searchProduct({searchKey: this.searchKey, cat: this.cat, family: this.pf })
    //     .then((result) => {
    //         this.prod = result.map(item=>{
    //             let rowLabel = 'Add';
    //             let rowValue = 'Add'; 
    //             let rowVariant = 'success';
    //             let Name = item.Product2.Name;
    //             let Code = item.Product2.ProductCode;
    //             let nVal = item.Product2.N__c;
    //             let pVal = item.Product2.P__c;
    //             let kVal = item.Product2.K__c;
    //             let isFert = item.Product2.hasFertilizer__c;
    //             let galWeight = item.Product2.X1_Gallon_Weight__c;
    //             let Product_Status__c = item.Product2.Product_Status__c;
    //             let Price = item.Agency_Product__c ? item.Floor_Price__c : item.Level_2_UserView__c; 
    //             return {...item, rowLabel, rowValue, rowVariant, Name, Code, Product_Status__c, Price, nVal, pVal, kVal, isFert, galWeight} 

    //         });
    //         //console.log(JSON.stringify(this.prod))
    //         this.error = undefined;
    //     })
    //     .catch((error) => {
    //         this.error = error;
    //         console.log(this.error);
            
    //     })
    //     .finally(() => {
    //         this.searchKey = undefined; 
    //         this.loaded = true; 
    //     })
        
    //   }

    async    addLineItem(e) {
                const rowAction = e.detail.action.name; 
                const prodId = e.detail.row.Id; 
                let priceInfo = await priorityPrice({priceBookIds: this.pbids, productId: prodId})
                const newProd = {    
                    rowName: e.detail.row.Name,
                    rowId: e.detail.row.Id,
                    rowCode: e.detail.row.Code, 
                    rowProduct: e.detail.row.Product2Id, 
                    rowProdType: e.detail.row.Product_Type__c,
                    rowUnitPrice: priceInfo[0].UnitPrice,
                    alt_PBE_Id: priceInfo[0].Id,
                    alt_PB_Name: priceInfo[0].Pricebook2.Name,
                    alt_PB_Id: priceInfo[0].Pricebook2Id,
                    rowFlrPrice: e.detail.row.Floor_Price__c, 
                    rowLevelOne: e.detail.row.Level_1_UserView__c,
                    rowMargin: e.detail.row.Level_2_Margin__c,
                    rowAgency: e.detail.row.Agency_Product__c,
                    rowCost: e.detail.row.Product_Cost__c,
                    rowSize: e.detail.row.Product_Size__c, 
                    rowN: e.detail.row.nVal,
                    rowP: e.detail.row.pVal,
                    rowK: e.detail.row.kVal,
                    isFert: e.detail.row.isFert,
                    galWeight: e.detail.row.galWeight,
                    rowWebSiteLabel: e.detail.row.Website_Label__c
                };

                if (rowAction === 'Add') {
                    let index = this.prod.findIndex(x => x.Id === prodId);
                    this.prod[index].rowLabel = 'X';
                    this.prod[index].rowAction = 'remove';
                    this.prod[index].rowVariant = 'destructive';
                    this.prod = [...this.prod];
                    this.dispatchEvent(new CustomEvent('newprod', {detail: newProd}));
                }
        }
}