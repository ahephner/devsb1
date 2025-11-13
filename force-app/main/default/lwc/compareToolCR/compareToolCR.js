import { LightningElement, api, track } from 'lwc';
//import priorityPrice from '@salesforce/apex/getPriceBooks.priorityBestPrice';
import allAppProducts from '@salesforce/apex/appProduct.allAppProducts';
import { priorityPricing} from 'c/helperOMS';
 import getPriceBooks from '@salesforce/apex/getPriceBooks.getPriceBookIds';
import basicInfo from '@salesforce/apex/appProduct.basicInfo';

export default class CompareToolCR extends LightningElement {
    @track pinnedProducts = [];       // Product to be pinned
    @track tableProduct = [];      // Table Product
    columns = [];
    @api recordId;
    showValue;
    
//price book ids
    pbIds; 
//acccount id get basicInfo will set this. call after product load
    accId;
    // Columns for Table only showing Name and Price till we get data on the table
    columns = [
        { label: 'Label', fieldName: 'label' },
        { label: 'Report Rate', fieldName: 'rate2'},
        { label: 'Unit Measure', fieldName: 'unitMeasure' },
        { label: 'Value', fieldName: 'value', type: 'currency'},
        { label: 'N', fieldName: 'nVal', type: 'number' },
        { label: 'P', fieldName: 'pVal', type: 'number' },
        { label: 'K', fieldName: 'kVal', type: 'number' },
        { label: 'Cost Per M', fieldName: 'costPerM', type: 'currency' },
        { label: 'Cost Per Acre', fieldName: 'costPerAcre', type: 'currency' },
        { label: 'Total Used', fieldName: 'totalUsed', type: 'number' }
    ];
    
    connectedCallback() {
        console.log('Record ID:', this.recordId);
        if (this.recordId) {
            this.fetchProgramProducts();
        }
    }
    //renderedCallback  => Fires more if the above is not workable MUST have a if statement ie
    //renderedCallbackt(){
    // if(!alreadyLoaded ){ call load function then set this.alreadyLoaded = true}}

    //     // ("$recordId") 

    // Look at This need applicationID not recID
    //maybe take a look at async in here because we may need to call a lot of differnt methods or we may just do in connectedCallback
    fetchProgramProducts(){
        console.log("This is the Start")
        allAppProducts({ rec: this.recordId })
            .then(result => {
                console.log(result)
                //look at return in here
                //https://github.com/ahephner/devsb1/blob/main/force-app/main/default/lwc/updateRatePrice/updateRatePrice.js
                this.pinnedProducts = result.map(item => {
                    let id = item.Id;
                    let label = item.Product_Name__c;
                    let rate2 = item.Rate2__c;
                    let unitMeasure = item.Unit_Area__c;
                    let value = item.Unit_Price__c;
                    let nVal = item.Product__r.N__c;
                    let pVal = item.Product__r.P__c;
                    let kVal = item.Product__r.K__c;
                    let costPerM = item.Cost_per_M__c;
                    let costPerAcre = item.Cost_per_Acre__c;
                    let totalUsed = item.Total_Used_f__c;
                    return { id, label, rate2, unitMeasure, value, nVal, pVal, kVal, costPerM, costPerAcre, totalUsed};
                });
                //unique could have 3 quicksilvers but only need to display 1
                console.log(this.pinnedProducts[0].label);
                this.productList = [{label:'Pick Product', value:''},...this.pinnedProducts.map(p => ({label: p.label, value: p.id}))];
                this.showValue = '';
            })
            .catch(error => {
                console.error('Error fetching program products', error);
            });
        console.log("This is the End")    
    }
    
    filterProd(event) {
        console.log('Filter Product:', event.target.options);
        console.log(event.target.value);
        console.log(event.recordId);
        const selectedId = event.target.value;
        if (!selectedId){
            this.tableProduct = [];
            return;
        }
        // Only display the selected product  
        const selectedProduct = this.pinnedProducts.find(p => p.id === selectedId);
        this.tableProduct = selectedProduct ? [selectedProduct] : [];
        this.searchProd = true;
        this.showComboBox = false;
    }

    demo = false; 
    // This is the event when the user clicks Compare
    handleAddToCompare(event) {
        // Updates the interface and empties table product
        this.searchProd = false;
        this.showCombobox = false;
        this.tableProduct;
        this.demo = true;
        
        // const recID = event.currentTarget.dataset.id;
        // const product = this.tableProduct.find(p => p.id === recID);
        // if (!product) return;

        // this.compareProducts = [...this.compareProducts, product];

    
    }
}