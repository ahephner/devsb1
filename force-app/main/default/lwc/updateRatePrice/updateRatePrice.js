import { LightningElement, api, track, wire } from 'lwc';
import appProducts from '@salesforce/apex/appProduct.appProducts'; 
import getPricing from '@salesforce/apex/appProduct.pricing';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import updateApplication from '@salesforce/apex/addApp.updateApplication';
import updateProducts from '@salesforce/apex/addApp.updateProducts';
import { getObjectInfo, getPicklistValues} from 'lightning/uiObjectInfoApi';
import PRODUCT_OBJ from '@salesforce/schema/App_Product__c';
import NOTE from '@salesforce/schema/App_Product__c.Note__c';
import { appTotal, alreadyAdded, pref,calcDryFert, calcLiqFert, unitsRequired, roundNum, pricePerUnit, perProduct, merge } from 'c/programBuilderHelper';
import {checkPricing} from 'c/helper'
export default class UpdateRatePrice extends LightningElement {
    @api appId; 
    appName; 
    appDate; 
    updateAppId;
    areaId; 
    areaName;
    @track prodlist;
    error; 
    loaded=false; 
    areaSizeM;
    areaAcres
    @track appTotalPrice = 0.00;
    sqft
    area
    areaUM
    addMore = false; 
    appTotalN;
    appTotalP;
    appTotalK;
    measure = 'M'; 
    costPerM = 0;
    costPerAcre = 0;
    prodAreaCost = 0;
    goodPricing = true;
    noteOps;
    //Here is notes per app
    //The wasNewNote note is a boolean that will indicate to apex cont to update note field or not
    wasNewNote = false; 
    oppNote

    connectedCallback(){
        this.loadProducts();
        //console.log('calling') 
    }
    get unitArea(){
        return [
            {label:'OZ/M', value:'OZ/M'}, 
            {label: 'OZ/Acre', value:'OZ/Acre'},
            {label: 'LB/M', value:'LB/M'},
            {label: 'LB/Acre', value:'LB/Acre'}
        ];
    }
        //need this to get picklist
        @wire(getObjectInfo, { objectApiName: PRODUCT_OBJ })
        objectInfo;

    //get sub category picklist
    @wire(getPicklistValues, {
        recordTypeId: "$objectInfo.data.defaultRecordTypeId",
        fieldApiName: NOTE
      })
      noteOps;
 
       async loadProducts(){
        try{
            let prodIds = new Set();
            this.loaded = false;
            let firstLoad = await appProducts({app: this.appId});
            let nonPrice = firstLoad.map(item =>{
                                let allowEdit = item.Product__r.Agency_Pricing__c ? item.Product__r.Agency_Pricing__c : item.Product__r.Agency_Pricing__c
                                let nVal = item.Product__r.N__c;
                                let pVal = item.Product__r.P__c;
                                let kVal = item.Product__r.K__c;
                                let type = item.Product__r.Product_Type__c; 
                                let isFert = item.Product__r.hasFertilizer__c;
                                let title = `Unit Price - Flr $${item.Product__r.Floor_Price__c}`; 
                                let galLb = item.Product__r.X1_Gallon_Weight__c
                                let goodPrice = true; 
                                let showNote = false; 
                                let btnLabel = 'Add Note';
                                let btnValue = 'Note';
                                this.appTotalPrice += item.Total_Price__c
                                prodIds.add(item.Product__c);
                                return {...item, allowEdit, nVal, pVal, kVal,type, isFert, title, galLb, goodPrice, showNote, btnLabel, btnValue}
                            });
            let idList = [...prodIds]
            let pricing = await getPricing({ids: idList });
            this.prodlist = await merge(nonPrice, pricing);
            //console.log(JSON.stringify(this.prodlist))
            //get your app and area info for the pop up screen
                this.appName = this.prodlist[0].Application__r.Name;            
                this.appDate = this.prodlist[0].Application__r.Date__c;             
                this.updateAppId = this.prodlist[0].Application__c;            
                this.areaId = this.prodlist[0].Application__r.Area__c           
                this.areaName = this.prodlist[0].Area__c            
                this.areaUM = this.prodlist[0].Application__r.Area__r.Pref_U_of_M__c; 
                this.oppNote = this.prodlist[0].Application__r.Note__c;             
                
    //need for doing math later
                this.areaSizeM= parseInt(this.prodlist[0].Application__r.Area__r.Area_Sq_Feet__c);
                this.areaAcres = parseInt(this.prodlist[0].Application__r.Area__r.Area_Acres__c);
            this.loaded = true;
        } catch (error) {
            console.error(error);
            const evt = new ShowToastEvent({
                title: 'Error on load..',
                message: error,
                variant: 'error'
            });
            this.dispatchEvent(evt); 
        }
    }

    @api
    addProducts(){
        this.addMore = true; 
    }
    @api
    closeAdd(){
        this.addMore = false; 
    }
//updating value functions below
        newAppName(e){
            this.appName = e.detail.value;
        }

        newAppDate(e){
            this.appDate = e.detail.value; 
        }


//get new rate for the product
        newRate(e){
            let index = this.prodlist.findIndex(prod => prod.Product_Code__c === e.target.name);
            
            window.clearTimeout(this.delay);
             // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.delay = setTimeout(()=>{
                this.prodlist[index].Rate2__c = Number(e.detail.value);
                //console.log('ua '+this.prodlist[index].Unit_Area__c);
                
                if(this.prodlist[index].Unit_Area__c != '' && this.prodlist[index].Unit_Area__c != null){
                    this.prodlist[index].Units_Required__c = unitsRequired(this.prodlist[index].Unit_Area__c, this.prodlist[index].Rate2__c, this.areaSizeM, this.prodlist[index].Product_Size__c )    
                    this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c, 2);
                    this.appTotalPrice = appTotal(this.prodlist)
                    let costs = perProduct(this.prodlist[index].Total_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c);
    
                    this.costPerM = costs.perThousand;
                    this.costPerAcre = costs.perAcre; 
                    this.prodAreaCost = this.areaAcres * this.costPerAcre; 
                   //console.log(1,this.prodlist[index].Unit_Area__c,2, this.prodlist[index].Rate2__c, 3,this.areaSizeM,4, this.prodlist[index].Product_Size__c)
                    if(this.prodlist[index].isFert){
                        let fert = this.prodlist[index].Product_Type__c === 'Dry' ? calcDryFert(this.prodlist[index].Rate2__c, this.prodlist[index]) : calcLiqFert(this.prodlist[index].Rate2__c, this.prodlist[index]);
                        this.appTotalN = fert.n;
                        this.appTotalP = fert.p;
                        this.appTotalK = fert.k
                    }
                }
                
            },500 ) 
           }

           handleUnitArea(e){
            let index = this.prodlist.findIndex(prod => prod.Product2Id === e.target.name);
            console.log('index ' +index + ' detail '+e.detail.value );
            
            this.prodlist[index].Unit_Area__c = e.detail.value;
            
            if(this.prodlist[index].Rate2__c > 0){
             this.prodlist[index].Units_Required__c = unitsRequired(this.prodlist[index].Unit_Area__c, this.prodlist[index].Rate2__c, this.areaSizeM, this.prodlist[index].Product_Size__c );
             this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c, 2);

             let costs = perProduct(this.prodlist[index].Total_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c);
    
             this.costPerM = costs.perThousand;
             this.costPerAcre = costs.perAcre; 
             this.prodAreaCost = this.areaAcres * this.costPerAcre; 
            }
        }

        
           lineTotal = (units, charge)=> (units * charge).toFixed(2);
           newPrice(e){
            window.clearTimeout(this.delay);
            let index = this.prodlist.findIndex(prod => prod.Product2Id === e.target.name);
            let targetId = e.target.name; 

            this.delay = setTimeout(()=>{
                this.prodlist[index].Unit_Price__c = e.detail.value;
                this.prodlist[index].Unit_Price__c = Number(this.prodlist[index].Unit_Price__c);
                //console.log(typeof this.prodlist[index].Unit_Price__c +' unit Type');          
                    
                    if(this.prodlist[index].Unit_Price__c > 0){
                    this.prodlist[index].Margin__c = roundNum((1 - (this.prodlist[index].Product_Cost__c /this.prodlist[index].Unit_Price__c))*100,2)
                    this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c,2);
                    
                    let costs = perProduct(this.prodlist[index].Total_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c);
    
                    this.costPerM = costs.perThousand;
                    this.costPerAcre = costs.perAcre; 
                    this.prodAreaCost = this.areaAcres * this.costPerAcre; 
                    this.appTotalPrice = appTotal(this.prodlist)
                    //this.handleWarning()
                }else{
                    this.prodlist[index].Margin__c = 0;                
                    this.prodlist[index].Margin__c = roundNum(this.prodlist[index].Margin__c, 2);
                    this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c,2)
                    
                    let costs = perProduct(this.prodlist[index].Total_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c);
    
                    this.costPerM = costs.perThousand;
                    this.costPerAcre = costs.perAcre; 
                    this.prodAreaCost = this.areaAcres * this.costPerAcre; 
                    this.appTotalPrice = appTotal(this.prodlist);
                }
                let lOne = this.prodlist[index].Level_1_UserView__c;
                let floor = this.prodlist[index].Floor_Price__c;
                let unitPrice = this.prodlist[index].Unit_Price__c;
                
                this.handleWarning(targetId,lOne, floor, unitPrice, index)
                }, 1000)
           }
           newMargin(m){
                window.clearTimeout(this.delay)
                    let index = this.prodlist.findIndex(prod => prod.Product2Id === m.target.name)
                    let targetId = m.target.name;
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    this.delay = setTimeout(()=>{
                            this.prodlist[index].Margin__c = Number(m.detail.value);
                            if(1- this.prodlist[index].Margin__c/100 > 0){
                                this.prodlist[index].Unit_Price__c = roundNum(this.prodlist[index].Product_Cost__c /(1- this.prodlist[index].Margin__c/100),2);
                                this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c, 2);

                                let costs = perProduct(this.prodlist[index].Total_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c);
    
                                this.costPerM = costs.perThousand;
                                this.costPerAcre = costs.perAcre; 
                                this.prodAreaCost = this.areaAcres * this.costPerAcre; 
                                
                            
                            }else{
                                this.prodlist[index].Unit_Price__c = 0;
                                this.prodlist[index].Unit_Price__c = roundNum(this.prodlist[index].Unit_Price__c, 2); 
                                this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c,2);
                                
                                let costs = perProduct(this.prodlist[index].Total_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c);
    
                                this.costPerM = costs.perThousand;
                                this.costPerAcre = costs.perAcre; 
                                this.prodAreaCost = this.areaAcres * this.costPerAcre; 
                                
                                
                            }
                            this.appTotalPrice = appTotal(this.prodlist)

                            
                            let lOne = this.prodlist[index].Level_1_UserView__c;
                            let floor = this.prodlist[index].Floor_Price__c;
                            let unitPrice = this.prodlist[index].Unit_Price__c;
                            this.handleWarning(targetId, lOne, floor, unitPrice, index)
                },1000)
            }

            newNotes(e){
                console.log(e.detail.value); 
                //this.prodlist = this.prodlist.find((x)=> x.Product2Id === e.target.name).Note__c = e.detail.value; 
            }
//remove product from app
removeProd(x){
    const row = x; 
    let cf = confirm('Do you want to delete this product');
    if(cf === true){
        deleteRecord(row)
            .then(()=>{
                let index = this.prodlist.findIndex(prod => prod.Product_Code__c === row);
                this.prodlist.splice(index, 1)
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success', 
                        message: 'Product Removed', 
                        variant: 'success'
                    }) 
                )
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
//catch new prod
listenNewProd(x){
        const newProd = x.detail.rowProduct;
        const alreadyThere = alreadyAdded(newProd, this.prodlist);
        if(!alreadyThere){
            this.handleNewProd(x)
        }else{
            return; 
        }
}

handleNewProd(x){
    //let passed = x.detail.rowProduct;
    this.prodlist = [...this.prodlist,{
        Id: '',
        Product__c: x.detail.rowProduct,
        Product_Name__c: x.detail.rowName,
        Product_Code__c: x.detail.rowCode,   
        Rate2__c: 0,
        Application__c: this.updateAppId,
        Note__c: '' ,
        Units_Required__c: 1,
        Unit_Area__c: pref(this.areaUM, x.detail.rowProdType),  
        Unit_Price__c: x.detail.rowAgency ? x.detail.rowFlrPrice : x.detail.rowUnitPrice,
        Product_Cost__c: x.detail.rowCost, 
        Margin__c: x.detail.rowAgency ? "" : x.detail.rowMargin, 
        Total_Price__c: x.detail.rowAgency ? x.detail.rowFlrPrice : x.detail.rowUnitPrice,
        Product_Size__c: x.detail.rowSize,
        allowEdit: x.detail.rowAgency ? true : false,
        Area__c:  this.areaId,
        nVal: x.detail.rowN,
        pVal: x.detail.rowP,
        kVal: x.detail.rowK,
        isFert: x.detail.isFert,
        galLb: x.galWeight,
        Product2Id: x.detail.rowProduct,
        goodPrice: true, 
        Floor_Price__c: x.detail.rowFlrPrice,
        Level_1_UserView__c: x.detail.rowLevelOne, 
        title:  x.detail.rowAgency ? 'Agency Product': `Unit Price - Flr $${x.detail.rowFlrPrice}`,
        showNote: false,
        btnLabel: 'Add Note',
        btnValue: 'Note', 
        Product_Type__c: x.detail.rowType

    }]
    //console.log(this.prodlist.at(-1))
}

//Display proudct info
mouse(e){
    let index = this.prodlist.findIndex((i)=> i.Product_Code__c === e.target.dataset.code)    
    let item = this.prodlist[index]
   // console.log(item)
    
}

    newNote(){
        this.wasNewNote = true; 
    }
//Update name and products
    @api 
    update(){
        this.loaded = false;
        // this.oppNote= this.template.querySelector('[data-note="appNote"]').value;
        // console.log('update ',this.oppNote)

        let params = {
            appName: this.appName,
            appDate: this.appDate,
            appArea: this.areaId, 
            appNote: this.oppNote
        }
        console.log('parmas ', params, 'this.appId ',this.appId, ' ap note ', this.wasNewNote);
        updateApplication({wrapper: params, id:this.appId, newNote:this.wasNewNote})
            .then(()=>{
               console.log(JSON.stringify(this.prodlist))
                updateProducts({products:this.prodlist})
            }).then((mess)=>{
                //console.log('mess '+mess)
                this.prodlist = [];
                this.dispatchEvent(
                    new ShowToastEvent({
                        title:'Success',
                        message:'Updated Products',
                        variant:'success'
                    })
                )
                this.cancel();
            }).catch((error)=>{
                //console.log(JSON.stringify(error))
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error adding app',
                        message: JSON.stringify(error),
                        variant: 'error'
                    })  
                ) 
            })
        }
        //Update Pricing and Fertility info displayed to per M or per Acre
    updateMeasure(){
        this.measure = this.measure === 'M' ? 'Acre' : 'M';
   }
    cancel(){
        this.dispatchEvent(new CustomEvent('cancel'))
        
    }
//handle select drop down on the products
    handleOnselect(event){
        let choice = event.detail.value;
        switch(choice){
            case 'Note':
                 this.prodlist.find((x)=>x.Product_Code__c === event.target.name).showNote = true;
                 this.prodlist.find((x)=>x.Product_Code__c === event.target.name).btnValue = 'Stash';
                 this.prodlist.find((x)=>x.Product_Code__c === event.target.name).btnLabel = 'Hide Note';
                break;
            case 'Delete':
                let prodName = event.target.name; 
                this.removeProd(prodName);
                break;
            case 'Stash':
                this.prodlist.find(e=>e.Product_Code__c === target.name).showNote = false;
                this.prodlist.find((x)=>x.Product_Code__c === event.target.name).btnValue = 'Note';
                this.prodlist.find((x)=>x.Product_Code__c === event.target.name).btnLabel = 'Add Note';
                break;
            default:
                console.log('no choice');
                
        }
    }
    //handle price warnings
    handleWarning = (targ, lev, flr, price, ind)=>{
        console.log(1,targ, 2,lev , 3,flr , 4,price, 5, ind );
        
        if(price > lev){        
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
            this.template.querySelector(`[data-margin="${targ}"]`).style.color ="black";
            this.prodlist[ind].goodPrice = true; 
           
        }else if(price<lev && price>=flr){
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="orange";
            this.template.querySelector(`[data-margin="${targ}"]`).style.color ="orange";
            this.prodlist[ind].goodPrice = true;
            
        }else if(price===lev && price>=flr){
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
            this.template.querySelector(`[data-margin="${targ}"]`).style.color ="black";
            this.prodlist[ind].goodPrice = true;
            
        }else if(price<flr){
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="red";
            this.template.querySelector(`[data-margin="${targ}"]`).style.color ="red";
            this.prodlist[ind].goodPrice = false;
        }
        //seems backward but using a disable btn on the productTable. So if it's bad I need to return a true so the button is disabled. 
        this.goodPricing = checkPricing(this.prodlist) === true ? false : true;

        
            this.dispatchEvent(new CustomEvent('price',{
                detail: this.goodPricing
            })); 
        
    }
}