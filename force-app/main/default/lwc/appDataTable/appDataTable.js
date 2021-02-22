import { LightningElement, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getApps from '@salesforce/apex/appProduct.getApps';
import { deleteRecord } from 'lightning/uiRecordApi';
import { APPLICATION_SCOPE,MessageContext,subscribe, unsubscribe} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
//table actions bottom of file shows how to handle
const actions = [
    { label: 'Show details', name: 'show_details' },
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
                console.log('result '+result.data);
                this.appList = result.data; 
                this.copy = result.data; 
                this.error = undefined; 
            }else if(result.error){
                this.error = result.error 
                this.appList = undefined; 
            }

        }
    //getUpdate
    handleUpdate(mess){
        console.log('yes?');
        
        if(mess.updateTable === true){
            return refreshApex(this.wiredAppList);
        }
    }

    unsubscribeFromMessageChannel(){
        unsubscribe(this.subscritption);
        this.subscritption = null; 
}
                //search table 
    look(searchTerm){
        this.appList = this.copy; 
        this.query = searchTerm.detail.value.toLowerCase(); 
        this.appList = this.appList.filter(x => x.Name.toLowerCase().includes(this.query));
        console.log(this.query);
                    
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
                console.log('Edit Clicked')
                
                break;
                
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