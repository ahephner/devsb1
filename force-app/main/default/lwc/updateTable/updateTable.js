import { LightningElement, wire } from 'lwc';
import { APPLICATION_SCOPE,MessageContext, publish, subscribe, unsubscribe} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from 'lightning/uiRecordApi';
import AREA from '@salesforce/schema/Application__c.Area__c';
import SQFT from '@salesforce/schema/Application__c.Area__r.Area_Sq_Feet__c';
import PREFMEASURE from '@salesforce/schema/Application__c.Area__r.Pref_U_of_M__c';
import addProducts from '@salesforce/apex/addApp.addProducts';
import cloneSingleApp from '@salesforce/apex/cpqProgramClone.cloneSingleApp';
const fields = [AREA, SQFT, PREFMEASURE];


export default class UpdateTable extends LightningElement {
    updateExposed = false;
    loaded = false;
    showCopyDate = false; 
    subscritption = null; 
    upProdTable = false;
    showButton = true; 
    appId; 
    selectedProducts = [];
    areaId;
    sqFt; 
    ornamental; 
    buttonText = 'Save';
    disableBtn = false; 
    @wire(MessageContext)
    messageContext; 
//subscribe to message channel
    subscribeToMessage(){
        if(!this.subscritption){
            this.subscritption = subscribe(
                this.messageContext,
                Program_Builder,
                (message) => this.handleMessage(message),
                {scope: APPLICATION_SCOPE}
            );
        }
    }
//handle the message
//then call get the area info for the product conversions 
    handleMessage(message){
        //console.log('handling new' +message.updateProd);
        this.updateExposed = message.updateProdTable;
        this.appId = message.appId; 
        this.upProdTable = message.updateProd; 
        this.addProduct = message.addProd; 
        this.loaded = true;
        this.buttonText = 'Save'
    }
//life cycle hooks
    unsubscribeFromMessageChannel(){
            unsubscribe(this.subscritption);
            this.subscritption = null; 
    }

    connectedCallback(){
        this.subscribeToMessage();
    }
    disconnectedCallback(){
        this.unsubscribeFromMessageChannel(); 
    }
//get the areaInfo need for making calculations in the pricing
@wire(getRecord,{recordId:'$appId', fields: fields})
wiredareaInfo({error,data}){
    if (error) {
        let message = 'Unknown error';
        if (Array.isArray(error.body)) {
            message = error.body.map(e => e.message).join(', ');
        } else if (typeof error.body.message === 'string') {
            message = error.body.message;
        }
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error loading contact',
                message,
                variant: 'error',
            }),
        );
    }else if(data){
        //console.log(data.fields.Area__r.value.fields.Area_Sq_Feet__c.value);
        this.sqFt = data.fields.Area__r.value.fields.Area_Sq_Feet__c.value;
        this.areaId = data.fields.Area__c.value;
        let prefMeasure = data.fields.Area__r.value.fields.Pref_U_of_M__c.value
        this.ornamental = prefMeasure  === '100 Gal' ? true : false;        

    }
}
    
    addProducts(){
        this.buttonText = 'Done';
        this.showButton = false; 
        if(!this.ornamental){
            this.template.querySelector('c-update-rate-price').addProducts();
        }else{
            this.template.querySelector('c-update-ornamental-rate-price').addProducts();
        }
    }
    copyApp(){
        this.showCopyDate = true; 
    }

    closeDatePicker(){
        this.showCopyDate = false; 
    }

    async copyProgram(x){
        this.loaded = false; 
        let dateUpdate = x.detail; 
        this.showCopyDate = false; 
        let mess = await cloneSingleApp({appId: this.appId, copyDate: dateUpdate});
        if(mess === 'success'){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success', 
                    message: 'App Copied!', 
                    variant: 'success'
                }) 
            );
            this.tellTable()
            this.closeModal()
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
    handleNext(){
        let txt = this.buttonText; 
       
        if(!this.ornamental){
            switch (txt) {
                case 'Save':
                    this.showButton = true; 
                    this.template.querySelector('c-update-rate-price').evalUpdate();
                    break;
                case 'Done':
                    this.showButton = true;
                    this.buttonText = 'Save';
                    this.template.querySelector('c-update-rate-price').closeAdd();
                    break
                default:
                    break;
            }
        }else{
            switch (txt) {
                case 'Save':
                    this.showButton = true; 
                    this.template.querySelector('c-update-ornamental-rate-price').update();
                    break;
                case 'Done':
                    this.showButton = true;
                    this.buttonText = 'Save';
                    this.template.querySelector('c-update-ornamental-rate-price').closeAdd();
                    break
                default:
                    break;
            }
        }

    }

    save(products){
        this.loaded = false; 
        const prod = JSON.stringify(products.detail);
        
        addProducts({products:prod})
            .then(()=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Application updated '+ this.appName,
                        variant: 'success',
                    }),
                );
                this.addPrice = false; 
                this.selectedProducts = [];
                this.closeModal();
            }).catch((error)=>{
                console.log(JSON.stringify(error))
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error adding app',
                        message: JSON.stringify(error),
                        variant: 'error'
                    }) 
                ) 
                this.addPrice = false; 
                this.selectedProducts = [];
                this.closeModal(); 
            })
    }
    tellTable(){
        const payload = {
            updateTable: true
        }
        publish(this.messageContext, Program_Builder, payload); 
    }

    closeModal(){
        this.updateExposed = false;  
        this.showButton = true;
        this.buttonText = 'Save'; 
        this.disableBtn = false;
    }

    badPrice(prod){
        this.disableBtn = prod.detail;
    }
}