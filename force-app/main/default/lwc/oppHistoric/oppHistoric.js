import { LightningElement, api } from 'lwc';
import history from '@salesforce/apex/appProduct.history';
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
    {label: 'Close Date', fieldName:'closeDate', cellAttributes:{alignment:'center'}, "initialWidth": 120},
    {label: 'Order Status', fieldName:'stage', cellAttributes:{alignment:'center'}, "initialWidth": 120}
]
export default class OppHistoric extends LightningElement{
    showHistory = false;
    @api date;
    @api acc;
    nothingFound = false;
    mess= '' 
    connectedCallback(){
        this.getHistory();
    }

    async getHistory(){
        if(this.date && this.acc){
            let data = await history({appdate: this.date,custId:this.acc})
            this.prod = await data.map((item, index) => ({
                rowLabel: 'Add',
                rowValue: 'Add',
                rowVariant: 'success',
                closeDate: item.Opportunity.CloseDate,
                stage: item.Opportunity.StangeName,
                oppName: item.Opportunity.Name,
                Name: item.Product2.Name,
                Code: item.ProductCode,
                Product_Status__c: item.Product2.Product_Status__c,
                Floor: item.Product2.Floor_Price__c,
                Id: item.Product2Id,
                Product2Id: item.Product2Id,
                Product_Type__c: item.Product2.Product_Type__c,
                Floor_Price__c: item.Product2.Floor_Price__c,
                //Level_2_Margin__c: item.Level_2_Margin__c,
                Agency_Product__c: item.Product2.Agency_Pricing__c,
                Product_Cost__c: item.Product2.Product_Cost__c,
                Product_Size__c: item.Product2.Size__c,
                nVal: item.Product2.N__c,
                pVal: item.Product2.P__c,
                kVal: item.Product2.K__c,
                isFert: item.Product2.hasFertilizer__c,
                galWeight: item.Product2.X1_Gallon_Weight__c,
                Product_SDS_Label__c: item.Product2.Website_Label__c
            }));
        }else{
            this.nothingFound = true;
            this.mess = 'error trying to load'; 
        }    

    }

    async handleRowAction(e){ 
        console.log(e); 
    }
    @api
    openMe(){
        this.showHistory = true; 
        console.log('showHistory')
    }
}