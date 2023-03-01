import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { APPLICATION_SCOPE,MessageContext, publish, subscribe, unsubscribe} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
import areaInfo from '@salesforce/apex/appProduct.areaInfo';
import addApplication from '@salesforce/apex/addApp.addApplication';
import addProducts from '@salesforce/apex/addApp.addProducts';
import multiInsert from '@salesforce/apex/addApp.multiInsert';
import {pref} from 'c/programBuilderHelper';
/* https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_salesforce_modules */
export default class ProductTable extends LightningElement {
    //controls what component is up
    exposed = false;
    dateName = false;
    productList = false; 
    productRates = false;
    subscritption = null;
    disableBtn = false; 
    //firstApp = true; 
    //searching product table 
    areaSelected;
    areaId;  
    count = 0; 
    //App Info
    appName;
    appDate;
    interval;
    numbApps;
    daysApart;
    customInsert = false; 
    currentStage = 'appInfo'
   @track selectedProducts = []; 

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
            //console.log('handling ' +message.connector);
            this.exposed = message.connector;
            this.areaSelected = message.message; 
            this.dateName = true;
            this.areaId = message.areaId;
            //control flow for when trying to call refresh apex
            //if an issue look at the reset below I changed to undefined used to be ''
            if(this.areaId){
               this.handleArea(this.areaId)
               //console.log('areaId '+this.areaId);
               
            }
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
        move(stage){
            stage = this.currentStage;
            switch(stage){
                case 'appInfo':
                    let go = this.template.querySelector('c-app-name-date').next();
                    go ? this.currentStage = 'selectProd' : '';
                    break;
                case 'selectProd':
                    let ok = this.template.querySelector('c-app-select-prod').next();
                    console.log({ok})
                    ok ? this.currentStage = 'ratePrice' : ''
                    break;
                case 'ratePrice':
                    let final = this.template.querySelector('c-app-rate-price').save();
                    console.log({final})
                    final ? this.currentStage = 'appInfo': '';
                    break;
            }
        }
        //get area info for the product calculations
        handleArea(x){  
            areaInfo({ai:x})
                .then((resp)=>{
                    this.areaSQft = resp[0].Area_Sq_Feet__c
                    this.areaUM = resp[0].Pref_U_of_M__c
                    //console.log('areaCall '+this.areaSQft);
                })
            }
//how to call a function from a child comp. if tracking values in parent 
    // search(){
    //      //this.template.querySelector('c-app-product-list').searchProd(this.searchKey, this.pf, this.cat);
    //      this.template.querySelector('c-app-select-prod').searchProd(this.searchKey, this.pf, this.cat);   
    // }

//close modal
    closeModal(){
        this.exposed = false; 
        //for now I have to turn both off. May make sense to either A. clear all values in the components first
        this.dateName = false;
        this.productList = false; 
        this.productRates = false; 
        this.currentStage = 'appInfo'; 
    }
    nextProdList(){
        this.dateName = false;
        this.productList = true; 
    }

    //set Name Date get values from appNameDate
    setNameDate(mess){
        this.appName = mess.detail.name;
        this.appDate = mess.detail.date;
        this.numbApps = mess.detail.numb;
        this.interval = mess.detail.spread;
        this.dateName = false;
        this.productList = true; 
        //console.log('spread '+ this.interval);
        
    }

    //gathers products from appSelectProd then maps over to set values for the appRatePrice that are need for the math functions
    //the pref uses the above function to set the unit of measure automatically for the user
    gatherProducts(mess){
        this.productList = false;
        this.productRates = true; 
        
         this.selectedProducts = mess.detail.map(item=>{
            
            return {...item,
               Product__c: item.Product__c,
               Product_Name__c: item.Name,   
               Rate2__c: 0,
               Application__c: '',
               Note__c: '' ,
               Units_Required__c: 1,
               Unit_Area__c: pref(this.areaUM, item.Product_Type__c),  
               Unit_Price__c: item.agency ? item.floorPrice : item.levelTwo,
               Product_Cost__c: item.unitCost, 
               Margin__c: item.agency ? "" : item.margin, 
               Total_Price__c: item.agency ? item.floorPrice : item.levelTwo,
               size: item.size,
               allowEdit: item.agency ? true : false,
               Area__c: '',
               isFert: item.isFert,
               galLb: item.galWeight,
               btnLabel:'Add Note',
               btnValue: 'Note',
               showNote: false,
               Note__c: '',
               costM:'',
               costA:''
            }
        } );
       
    }
    save(prod){ 
        this.selectedProducts = prod.detail; 
        let params = {
            appName: this.appName,
            appArea: this.areaId,
            appDate: this.appDate
        }
        addApplication({wrapper:params})
            .then((resp)=>{
                this.appId = resp.Id;
                this.selectedProducts.forEach((x)=> x.Application__c = this.appId)
                let products = JSON.stringify(this.selectedProducts);
                console.log('products '+products);

                addProducts({products:products})
                    .then(()=>{
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Application created '+ this.appName,
                                variant: 'success',
                            }),
                        );      
                    }).then(()=>{
                        //console.log('interval '+this.interval);
                        
                        if(this.interval !='once'){
                            multiInsert({appId:this.appId, occurance:this.numbApps, daysBetween: this.interval})
                        }
                    }).then(()=>{
                        const payload = {
                            updateTable: true
                        }
                        publish(this.messageContext, Program_Builder, payload);
                        //console.log('sending '+ payload.updateTable);
                        
                    }).then(()=>{
                        //this.firstApp = true; 
                        this.closeModal(); 
                        this.appName = '';
                        //this may be an issue was = ''; 
                        this.areaId = undefined;
                        this.appDate = '';
                        this.selectedProducts = [];
                    }).catch((error)=>{
                        console.log(JSON.stringify(error))
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
                        this.closeModal(); 
                    })
            })

         
    }

    badPrice(prod){
        this.disableBtn = prod.detail;
    }
}
