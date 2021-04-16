import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getApps from '@salesforce/apex/appProduct.getApps';
import getAreas from '@salesforce/apex/appProduct.getAreas';
import { deleteRecord } from 'lightning/uiRecordApi';
import { APPLICATION_SCOPE,MessageContext,publish,subscribe, unsubscribe} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
//table actions bottom of file shows how to handle
const actions = [
    { label: 'Show details', name: 'show_details' },
    {label:'Add Products', name:'add_products'},
    { label: 'Delete', name: 'delete' },
];

//table columns calling actions drop down in last place of the array
//so drop down is always far right of table
const columns = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Area', fieldName: 'Area_Name__c', sortable: "true" },
    { label: 'Date', fieldName: 'Date__c', sortable: "true"},

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
    subscription= null;   
   
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
                this.error = undefined; 
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
    handleUpdate(mess){
        console.log('yes?');
        
        if(mess.updateTable === true){
            return refreshApex(this.wiredAppList);
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
    selectArea(x){
        let areaName = x.target.options.find(opt => opt.value === x.detail.value).label;
        
        
        if(areaName==='All'){
            this.appList = this.copy
        }else{
            console.log('areaName2 '+areaName);
            this.appList = this.copy
            this.appList = this.appList.filter(x => x.Area_Name__c === areaName)
        }
    }
    //handle table row actions. Delete or pop up to edit. 
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row.Id;
        
        switch (actionName) {
            case 'delete':{
                    // eslint-disable-next-line no-case-declarations
                    // eslint-disable-next-line no-alert
                    let cf = confirm('Do you want to delete this entry?')
                    if(cf===true){
                deleteRecord(row)
                    .then(() => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success', 
                                message: 'App Deleted', 
                                variant: 'success'
                            }) 
                        );//this refreshes the table  
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
            }
                break;
            case 'show_details':
                const payload = {
                    updateProdTable: true,
                    addProd: false,
                    updateProd: true,
                    appId: row
                }
                publish(this.messageContext, Program_Builder, payload); 
                
                
                break;
            case 'add_products': 
                const payload2 = {
                    updateProdTable: true,
                    addProd: true,
                    updateProd: false,
                    appId: row
                }
                publish(this.messageContext, Program_Builder, payload2);
                
            default:
        }
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