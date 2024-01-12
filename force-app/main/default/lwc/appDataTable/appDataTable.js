import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getApps from '@salesforce/apex/appProduct.getApps';
import getAreas from '@salesforce/apex/appProduct.getAreas';
import cloneSingleApp from '@salesforce/apex/cpqProgramClone.cloneSingleApp';
//import savePDF_File from '@salesforce/apex/AttachPDFController2.savePDF_File';
import { deleteRecord } from 'lightning/uiRecordApi';
import { APPLICATION_SCOPE,MessageContext,publish,subscribe, unsubscribe} from 'lightning/messageService';
import LightningConfirm from 'lightning/confirm';

import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
import {onLoadTotalPrice} from 'c/programBuilderHelper';
//table actions bottom of file shows how to handle
const actions = [
    { label: 'Show details', name: 'show_details' },
     {label:'Copy', name:'copy_app'},
    { label: 'Delete', name: 'delete' },
];

//table columns calling actions drop down in last place of the array
//so drop down is always far right of table
const columns = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Area', fieldName: 'Area_Name__c', sortable: "true" },
    { label: 'Date', fieldName: 'Date__c', sortable: "true"},
    {label: 'Total Price', 
    fieldName:'Total_Price_ap__c', 
    type:'currency',
    sortable:'true',
    cellAttributes: { alignment: 'left' }},

    {
        type: 'action',
        typeAttributes: { rowActions: actions },
    },
];

export default class AppDataTable extends LightningElement {
    @api recordId;
    columns = columns; 
    sortBy;
    sortDirection; 
    query;
    appList;
    copy;
    //used to pass areaId to pdf creator
    areaId; 
    //expose customer copy button
    //getCopy = false; 
    subscription= null;   
    loaded = false;
    showOrder = false; 
    showCopyDate = false; 
    programName;
    customerName; 
    totalPrice = 0.00; 
    rowId; 
    //lifestyle hooks for messageService
    connectedCallback(){
        this.subscribeToMessage();
    }

    disconnectedCallback(){
        this.unsubscribeFromMessageChannel(); 
    }
    unsubscribeFromMessageChannel(){
        unsubscribe(this.subscritption);
        this.subscritption = null; 
}
//subscribe for refresh
    @wire(MessageContext)
    messageContext;
        subscribeToMessage(){
            if(!this.subscription){
                this.subscription = subscribe(
                    this.messageContext,
                    Program_Builder,
                    (message)=> this.handleUpdate(message),
                    {scope:APPLICATION_SCOPE})
            }
        } 

    @wire(getApps, {recordId: '$recordId'})
        wiredList(result){
            //console.log('app table recordID', this.recordId)
            this.wiredAppList = result; 
            if(result.data){
                
                this.appList = result.data; 
                this.copy = result.data; 
                this.programName = result.data[0] ? result.data[0].Program_Name__c :'' ;
                this.customerName = result.data[0] ? result.data[0].Customer_Name__c : '';
                this.error = undefined; 
                this.totalPrice = onLoadTotalPrice(result.data); 
                this.loaded = true;     
            }else if(result.error){
                this.error = result.error 
                this.appList = undefined; 
            }

        }
//get areas for searching the table by area
//this was a pain to get to work. Since returned data is immutable have to make a copy then you can add to it    
    @wire(getAreas, {recordId: '$recordId'})
        areaList

        get areaOptions(){
            //console.log('recordId '+this.recordId);
            if(this.areaList.data != undefined){
            var ops = this.areaList.data.map(el =>{
                return {...el}
            })
            ops.unshift({label:'All', value:'All'})
            //console.log('ops '+ops);
            }

            return ops;
            //if there are issues in the future
            //you can replace the above with return this.areaList.data
        }
    
    //getUpdate
    //call a timeout to let the database insert multiple apps
    //then retrieve the new values
    handleUpdate(mess){
        this.loaded = false; 
       // console.log(1, this.loaded)
        window.clearTimeout(this.delay);
        if(mess.updateTable === true){
            this.delay = setTimeout(()=>{
                this.loaded = true; 
                return refreshApex(this.wiredAppList);
            },2000) 
        }else{
            this.loaded= true;
        }
    }
    //I found  the search by area to be more helpfull. You can add back search function here

    //             //search table 
    // look(searchTerm){
    //     this.appList = this.copy; 
    //     this.query = searchTerm.detail.value.toLowerCase(); 
    //     this.appList = this.appList.filter(x => x.Name.toLowerCase().includes(this.query));
    //     //console.log(this.query);
                    
    // }
//search by area
//set area id to pass to pdf creator
    selectArea(x){
        let areaName = x.target.options.find(opt => opt.value === x.detail.value).label;
        this.areaId = x.detail.value; 

        if(areaName==='All'){
            this.appList = this.copy
            //this.getCopy = false; 
        }else{
            //console.log('areaName2 '+areaName);
            this.appList = this.copy
            this.appList = this.appList.filter(x => x.Area_Name__c === areaName)
            //this.getCopy = true; 
        }
    }
    async  handleConfirm(){
        const res = await LightningConfirm.open({
            message: 'Do you want to delete this entry?',
            variant: 'headless',
            label:'Delete'
        })
        return res; 
        }

    closeDatePicker(){
        this.showCopyDate = false; 
    }

    async copyProgram(x){
        let dateUpdate = x.detail; 
        this.showCopyDate = false; 
        this.loaded = false; 
        let mess = await cloneSingleApp({appId: this.rowId, copyDate: dateUpdate});
        if(mess === 'success'){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success', 
                    message: 'App Copied!', 
                    variant: 'success'
                }) 
            );
            refreshApex(this.wiredAppList)
        }else if(mess!= 'sucess'){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error deleting record',
                    message: JSON.stringify(mess),
                    variant: 'error'
                })
            ) 
        } 
        this.loaded = true; 
    }
    //handle table row actions. Delete or pop up to edit. 
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        this.rowId = event.detail.row.Id;
        
        switch (actionName) {
            case 'delete':{
                    // eslint-disable-next-line no-case-declarations
                    // eslint-disable-next-line no-alert
            this.handleConfirm()
                    .then((res)=>{
                        if(res===true){
                            this.loaded = false; 
                            deleteRecord(this.rowId)
                                .then(() => {
                                    this.dispatchEvent(
                                        new ShowToastEvent({
                                            title: 'Success', 
                                            message: 'App Deleted', 
                                            variant: 'success'
                                        }) 
                                    );
                                    this.loaded = true;
                                    //this refreshes the table  
                                    return refreshApex(this.wiredAppList)
                                })
                                .catch(error => {
                                    this.dispatchEvent(
                                        new ShowToastEvent({
                                            title: 'Error deleting record',
                                            message: JSON.stringify(error),
                                            variant: 'error'
                                        })
                                    )
                                })
                            }
                    })

            }
                break;
            case 'show_details':
                const payload = {
                    updateProdTable: true,
                    addProd: false,
                    updateProd: true,
                    appId: this.rowId
                }
                publish(this.messageContext, Program_Builder, payload); 
                
                
                break;
            case 'copy_app': 
               this.showCopyDate = true; 
            default:
        }
}

//This function calls the apex class that attaches the customer copy to the program 
//  createPDF(){
//     console.log('ai', this.areaId);
    
//      this.loaded = false; 
//     savePDF_File({Id: this.areaId, appId: this.recordId})
//         .then(()=>{
//             this.dispatchEvent(
//                 new ShowToastEvent({
//                     title:'PDF Created',
//                     message:'Check File Tab',
//                     variant: 'success',
//                 }),
//             );
//             this.loaded = true; 
//         }).catch((error)=>{
//             let message = 'Unknown error';
//             if (Array.isArray(error.body)) {
//                 message = error.body.map(e => e.message).join(', ');
//             } else if (typeof error.body.message === 'string') {
//                 message = error.body.message;
//             }
//             this.dispatchEvent(
//                 new ShowToastEvent({
//                     title: 'Error loading contact',
//                     message,
//                     variant: 'error',
//                 }),
//             );
            
//         })
//     }
 makeOrder(){
    this.showOrder = true; 
 }

 closeOrder(){
    this.showOrder = false; 
 }
 //handle table sorting sorting
 //Grabbed this from a salesforce example
 handleSortdata(event) {
    // field name
    this.sortBy = event.detail.fieldName;

    // sort direction
    this.sortDirection = event.detail.sortDirection;

    // calling sortdata function to sort the data based on direction and selected field
    this.sortData(event.detail.fieldName, event.detail.sortDirection);
}

sortData(fieldname, direction) {
    // serialize the data before calling sort function
    let parseData = JSON.parse(JSON.stringify(this.appList));

    // Return the value stored in the field
    let keyValue = (a) => {
        return a[fieldname];
    };

    // cheking reverse direction 
    let isReverse = direction === 'asc' ? 1: -1;

    // sorting data 
    parseData.sort((x, y) => {
        x = keyValue(x) ? keyValue(x) : ''; // handling null values
        y = keyValue(y) ? keyValue(y) : '';

        // sorting values based on direction
        return isReverse * ((x > y) - (y > x));
    });

    // set the sorted data to data table data
    this.appList = parseData;

}
}