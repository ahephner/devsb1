import { LightningElement, api } from 'lwc';
import searchProduct from '@salesforce/apex/appProduct.searchProduct2'
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
    columns = columnList
}