import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getApps from '@salesforce/apex/appProduct.getApps';
import getAreas from '@salesforce/apex/appProduct.getAreas';
import getProds from '@salesforce/apex/appProduct.dataTableBuildFilter';
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
    productList = []; 
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

        @wire(getProds, {program:'$recordId'})
            wiredProds(result){
                if(result.data){
                    this.buildProdFilter(result.data);
                }else if(result.error){
                    console.error('prod load => '+result.error.body.message); 
                }
            }
        allProds = []
        prodFilterValue
        buildProdFilter(data){
            
            let initArray= [];
            for(let i = 0; i<data.length; i++){
                let name = data[i].Product_Name__c;
                let id = data[i].Id;
                let appId = data[i].Application__r.Id; 
                let obj = {label:name, value:id, app:appId}
                initArray.findIndex(x=>x.label === obj.label) === -1 ? initArray.push(obj) : '';
                this.allProds.push(obj)
            }
            
            this.productList = [{label:'All', value:'All'}, ...initArray];
            this.prodFilterValue = 'All';  
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
            this.area= 'All'
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
    filterProd(x){
    x.preventDefault();
       let prodFilter = x.target.options.find(opt => opt.value === x.detail.value);
       this.prodFilterValue = prodFilter.value; 
       
    if(prodFilter.label==='All' && (this.areaId===undefined || this.areaId ==='All')){
        this.appList = this.copy
        //this.getCopy = false; 
    }else{
        //this.allProds = this.allProds.filter()
        this.appList = this.copy
        let getApps = this.allProds.filter(x => x.label.includes(prodFilter.label))
        
        if(this.areaId != undefined && this.areaId != 'All' && prodFilter.label !='All' ){
            console.log('area plus product')
            this.appList = this.appList.filter(obj1 => {
                return getApps.some(obj2 => obj1.Id === obj2.app && obj1.Area__c === this.areaId)
            })
        }else if(prodFilter.label !='All' && (this.areaId===undefined || this.areaId ==='All')){
            console.log('product searching')
            this.appList = this.appList.filter(obj1 => {
                return getApps.some(obj2 => obj1.Id === obj2.app)
            })
        }else if(prodFilter.label ==='All' && (this.areaId != undefined || this.areaId !='All')){
            console.log('use area filter')
            let labelName = this.areaOptions.find(i=> i.value === this.refs.areaBox.value)//.label
            console.log(labelName)
            this.selectArea(labelName, true); 
        }
        

        //this.getCopy = true; 
    }

    }
//search by area
//set area id to pass to pdf creator
    selectArea(x, y){
        let areaName;
        
        if(y){
            areaName = x.label; 
            this.areaId = x.value; 
            
        }else{
            areaName = x.target.options.find(opt => opt.value === x.detail.value).label;
            this.areaId = x.detail.value; 
        }

        if(areaName==='All' && this.prodFilterValue==='All'){
            this.appList = this.copy
            //this.getCopy = false; 
        }else if(areaName !='All' && this.prodFilterValue==='All'){
            //console.log('areaName2 '+areaName);
            this.appList = this.copy
            
            this.appList = this.appList.filter(x => x.Area_Name__c === areaName)
            //this.getCopy = true; 
        }else if(areaName ==='All' && this.prodFilterValue!='All'){
            let prodFilter = this.productList.find(opt => opt.value === this.refs.prodBox.value);
            let getApps = this.allProds.filter(x => x.label.includes(prodFilter.label))
            this.appList = this.copy
            this.appList = this.appList.filter(obj1 => {
                return getApps.some(obj2 => obj1.Id === obj2.app)
            })
        }else{
            //product selected new area picked but it is not all value
            let prodFilter = this.productList.find(opt => opt.value === this.refs.prodBox.value);
            let getApps = this.allProds.filter(x => x.label.includes(prodFilter.label))
            this.appList = this.copy
            //filter area
            this.appList = this.appList.filter(x => x.Area_Name__c === areaName)
            //filter product
            this.appList = this.appList.filter(obj1 => {
                return getApps.some(obj2 => obj1.Id === obj2.app)
            })
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
        let dateUpdate = x.detail.date;
        let areaId = x.detail.area 
        this.showCopyDate = false; 
        this.loaded = false; 
        let mess = await cloneSingleApp({appId: this.rowId, copyDate: dateUpdate, aId: areaId});
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
    copyAreaId; 
    //handle table row actions. Delete or pop up to edit. 
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        this.rowId = event.detail.row.Id;
        this.copyAreaId = event.detail.row.Area__c;
        console.log(1, this.copyAreaId)
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
                    appId: this.rowId,
                    areaArray: this.areaOptions
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