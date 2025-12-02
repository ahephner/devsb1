import { LightningElement, api, track } from 'lwc';
//import priorityPrice from '@salesforce/apex/getPriceBooks.priorityBestPrice';
import allAppProducts from '@salesforce/apex/appProduct.allAppProducts';
import prodIdToData from '@salesforce/apex/dataFromProductIdCR.prodIdToData';
import { priorityPricing} from 'c/helperOMS';
 import getPriceBooks from '@salesforce/apex/getPriceBooks.getPriceBookIds';
//import basicInfo from '@salesforce/apex/appProduct.basicInfo';
import SearchContact from 'c/searchContactAddress'
import { appTotal, alreadyAdded, pref,compareToolDryFert, compareToolLiqFert, unitsRequired, roundNum, pricePerUnit, perProduct, merge, areaTreated, sumFert, totalUsed,lowVolume, lvUnits } from 'c/programBuilderHelper';
import {checkPricing, sumByKey} from 'c/helper'

export default class CompaireForCaige extends LightningElement {
    
    @track pinnedProducts = [];       // Product to be pinned
    @track tableProduct = [];      // Table Product
    
    @api recordId;
    showValue;
    
//price book ids
    pbIds; 
    priceBooks;
//acccount id get basicInfo will set this. call after product load
    accId;
    // Columns for Table only showing Name and Price till we get data on the table

               //for the combo box 
           get unitArea(){
            return [
                {label:'OZ/M', value:'OZ/M'}, 
                {label: 'OZ/Acre', value:'OZ/Acre'},
                {label: 'LB/M', value:'LB/M'},
                {label: 'LB/Acre', value:'LB/Acre'},
                {label:'100 Gal', value:'100 Gal'}
            ];
        }
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
                this.pinnedProducts = result.map((item,index) => {
                    let id = item.Id;
                    let label = item.Product_Name__c;
                    let rate2 = item.Rate2__c;
                    let unitMeasure = item.Unit_Area__c;
                    let price = item.Unit_Price__c;
                    let isFert = item.Product__r.hasFertilizer__c
                    let N__c = !item.Product__r.hasFertilizer__c ? 'N/A': item.N__c;
                    let P__c = !item.Product__r.hasFertilizer__c ? 'N/A': item.P__c;
                    let K__c = !item.Product__r.hasFertilizer__c ? 'N/A': item.K__c;
                    let costPerM = item.Cost_per_M__c;
                    let costPerAcre = item.Cost_per_Acre__c;
                    let totalUsed = item.Total_Used_f__c;
                    let firstItem = true;
                    
                    return {...item, id, label, rate2, isFert, unitMeasure, price, N__c, P__c, K__c, costPerM, costPerAcre, totalUsed,firstItem};
                });
                //unique could have 3 quicksilvers but only need to display 1
                this.accId = this.pinnedProducts[0].Application__r.Area__r.Program__r.Account__c; 
                this.buildProdFilter(this.pinnedProducts)
                this.showValue = '';
            }).then(()=>{
                let priceBooks
                if(this.accId){
                     priceBooks = getPriceBooks({accountId: this.accId})
                }
                return priceBooks
            }).then((res)=>{ 
                    this.pbIds = [...priorityPricing(res).priceBookIdArray];
                    console.log(this.pbIds)
            })
            .catch(error => {
                console.error('Error fetching program products', error);
            });
            
    }

    
        buildProdFilter(data){
        console.log(data)
        let initArray= [];
        for(let i = 0; i<data.length; i++){
            let name = data[i].label;
            let id = data[i].Product__c;
            
            let obj = {label:name, value:id, Id:id}
            initArray.findIndex(x=>x.label === obj.label) === -1 ? initArray.push(obj) : '';
           // this.allProds.push(obj)
        }
        
        //{label:'search', value:'search'},
        this.productList = [{label:'Pick Product', value:'Pick Product'}, ...initArray];
        this.showValue = 'Pick Product';  
        
    }
    filterProd(event) {

        const selectedId = event.target.value;
        if (!selectedId){
            this.tableProduct = [];
            return;
        }
        // Only display the selected product  
        if(selectedId ==='Pick Product'){
            this.openSearch()
        }else{
            const selectedProduct = this.pinnedProducts.find(p => p.Product__c === selectedId);
            this.tableProduct = selectedProduct ? [selectedProduct] : [];
            this.showCompareBtn = true;
            this.showComboBox = false;
            this.number = 0; 
        }
    }
    async openSearch(){
        const show = await SearchContact.open({
                size: 'medium',
                description: 'address',
                content: this.productList.slice(2)
            }).then((res)=>{
                console.log(10,res)
            const selectedProduct = this.pinnedProducts.find(p => p.Product__c === res);
            this.tableProduct = selectedProduct ? [selectedProduct] : [];
            this.showCompareBtn = true;
            this.showComboBox = false;
            this.number = 0; 
            })
    }
    
    btnName = 'first'
    // This is the event when the user clicks Compare
    handleAddToCompare(event) {
        // Updates the interface and empties table product
        let name = event.target.name
        switch (name) {
            case 'first':
                this.btnName = 'second';
                this.showCompareBtn = false;
                this.searchProd = true; 
                break;
            case 'second':
                this.btnName = 'third';
                this.showCompareBtn = false;
                this.searchProd = true; 
                break
            case 'third':
                this.btnName = 'fourth';
                this.showCompareBtn = false;
                this.searchProd = true; 
                break
            default:
                break;
        }
    }
    maxPick = false; 
    number = 0
    handleProductSelect(evt){
        const prodId = evt.detail;

        if (!prodId) return;

        prodIdToData({ pIds: this.pbIds, id: prodId })
            .then(results => {
                //console.log(results)
                if (!results || results.length === 0) return;
                let pricing =  results.bestPrice;
                let product = [results.selectedProduct]
                const productData = product.map(x=>{
                    let id = x.Id
                    let Product__c = x.Id
                    let label = x.Name
                    let rate2 = 0
                    let unitMeasure = x.Product_Type__c === 'Dry'? 'LB/M':'OZ/Acre';
                    let price = x.Floor_Price__c
                    let Unit_Price__c = pricing?.UnitPrice ?? x.Floor_Price__c;
                    let Margin__c =  pricing?.List_Margin__c ?? 0
                    let isFert = x.hasFertilizer__c;
                    let N__c =  !x.hasFertilizer__c ? 'N/A': x.N__c;
                    let P__c = !x.hasFertilizer__c ? 'N/A': x.P__c;
                    let K__c = !x.hasFertilizer__c ? 'N/A': x.K__c;
                    let costPerM = 0.00
                    let costPerAcre = 0.00
                    let totalUsed = 0.00
                    let Product_Size__c = x.Size__c; 
                    let Unit_Area__c = x.Product_Type__c === 'Dry'? 'LB/M':'OZ/Acre';
                    let Product__r = {N__c: x.N__c, P__c: x.P__c, K__c: x.K__c, X1_Gallon_Weight__c: x.X1_Gallon_Weight__c} 
                    let firstItem =false; 
                    return {...x, id, Product__c, label, rate2, unitMeasure, price, Unit_Price__c, Margin__c, isFert, N__c, P__c, K__c, costPerM, costPerAcre, totalUsed, Product_Size__c, Unit_Area__c, Product__r, firstItem}
                });

                this.tableProduct = [...this.tableProduct,...productData ]
            // push object to tableProduct
                //this.tableProduct = [...this.tableProduct, {
                     //id: productData.Id,
                     //Product__c: productData.Id,
                     //label: productData.Name,
                     //rate2: 0,
                     //unitMeasure:'OZ/M', //productData.Unit_Area__c,
                     //price: productData.Floor_Price__c,
                    //  isFert: productData.hasFertilizer__c,
                    //  N__c: !productData.hasFertilizer__c ? 'N/A': productData.N__c,
                    //  P__c: !productData.hasFertilizer__c ? 'N/A': productData.P__c,
                    //  K__c: !productData.hasFertilizer__c ? 'N/A': productData.K__c,
                     //costPerM: 0.00,//productData.Cost_per_M__c,
                     //costPerAcre: 0.00,//roductData.Cost_per_Acre__c,
                     //totalUsed: 0.00,
                     //Unit_Area__c: productData.Product_Type__c === 'Dry'? 'LB/M':'OZ/Acre'
                     //firstItem: index >= 1 ? false: true 
                    //return {...item, id, label, rate2, isFert, unitMeasure, price, N__c, P__c, K__c, costPerM, costPerAcre, totalUsed,firstItem}; //productData.Total_Used_f__c
                //}];
                // Hide Product2 dropdown
                this.demo = false;
                
                // Show Compare button again if user can pick more
                if (this.number <= 3) {
                    this.searchProd = true;
                    this.handleNextView(this.number, 'forward');
                } else {
                    this.searchProd = false;
                    this.maxPick = true;
                }

                console.log('Product added to table:', productData);
            })
            .catch(error => console.error(error));
    }
//need to work on reset like pick a new proudct this needs to go back to zero 
    handleNextView(num, type){
        if(this.number >= 4)return

        switch (true) {
            case (num === 0 && type === 'forward'):
                this.number ++
                this.searchProd = false;
                this.showCompareBtn = true; 
                break;
            case (num === 1 && type === 'forward'):
                this.number ++
                this.searchProd = false;
                this.showCompareBtn = true;
                break;
            case (num === 2 && type === 'forward'):
                this.number ++
                this.searchProd = false;
                this.showCompareBtn = false;
                this.maxPick = true
                break;
            case (num === 3 && type === 'forward'):
                this.searchProd = false;
                break
            default:
                break;
        }
    }
        handleReplacement(event){
            const name = event.target.name;
        }
    //MATH FUNCTIONS 
    //use this.productList = single values we can then do a mass update in apex
    //Rate
    handleRate(item){
        let index = this.tableProduct.findIndex(x=> x.Product__c === item.target.name); 

        window.clearTimeout(this.delay);

        this.delay = setTimeout(()=>{
            this.tableProduct[index].Rate2__c = Number(item.detail.value);

            if(this.tableProduct[index].Unit_Area__c != '' && this.tableProduct[index].Unit_Area__c != null && this.tableProduct[index].Unit_Area__c != '100 Gal' ){
                    this.tableProduct[index].Units_Required__c = unitsRequired(this.tableProduct[index].Unit_Area__c, this.tableProduct[index].Rate2__c, this.areaSizeM, this.tableProduct[index].Product_Size__c )    
                    this.tableProduct[index].totalUsed = totalUsed(this.tableProduct[index].Unit_Area__c, this.areaSizeM, this.tableProduct[index].Rate2__c);
                    this.tableProduct[index].Total_Price__c = roundNum(this.tableProduct[index].Units_Required__c * this.tableProduct[index].Unit_Price__c, 2);

                    let prodCost = pricePerUnit(this.tableProduct[index].Unit_Price__c, this.tableProduct[index].Product_Size__c, this.tableProduct[index].Rate2__c,this.tableProduct[index].Unit_Area__c);
                    this.tableProduct[index].Cost_per_M__c = prodCost.perThousand;
                    this.tableProduct[index].Cost_per_Acre__c = prodCost.perAcre; 
                    //this.productIds.includes(this.tableProduct[index].Product__c) ? '': this.productIds.push(this.tableProduct[index].Product__c);

                    //fert info 
                    if(this.tableProduct[index].isFert){
                        let fert = this.tableProduct[index].Product_Type__c === 'Dry' ? compareToolDryFert(this.tableProduct[index].Rate2__c, this.tableProduct[index].Product__r, this.tableProduct[index].Unit_Area__c) : compareToolLiqFert(this.tableProduct[index].Rate2__c, this.tableProduct[index].Product__r);
                        this.tableProduct[index].N__c = fert.n;
                        this.tableProduct[index].P__c = fert.p;
                        this.tableProduct[index].K__c = fert.k;
                        //let totalFert = sumFert(this.tableProduct)
                        //this.appTotalN = roundNum(totalFert.N__c, 4);
                        //this.appTotalP = roundNum(totalFert.P__c, 4);
                        //this.appTotalK = roundNum(totalFert.K__c, 4);

                    }else{
                        this.tableProduct[index].N__c = 0;
                        this.tableProduct[index].P__c = 0;
                        this.tableProduct[index].K__c = 0;
                   }
            }else if(this.tableProduct[index].Unit_Area__c ==='100 Gal'){
                    this.tableProduct[index].isLowVol__c = true; 
                    this.tableProduct[index].unitAreaStyles = 'slds-col slds-size_2-of-12 lowVolume'
                    this.tableProduct[index].Rate2__c = Number(e.detail.value)
                    let {Rate2__c, Product_Size__c, Spray_Vol_M__c, Unit_Price__c} = this.tableProduct[index];
    
                    if(Spray_Vol_M__c>0 && Rate2__c> 0){
                       
                        let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, Unit_Price__c) 
                        
                        //updateValues
                        this.tableProduct[index].Units_Required__c = lvUnits(this.areaSizeM, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                        this.tableProduct[index].Total_Price__c = roundNum(this.tableProduct[index].Units_Required__c * this.tableProduct[index].Unit_Price__c, 2);
                        
                         
                        this.tableProduct[index].Cost_per_M__c = finished.singleThousand;
                        this.tableProduct[index].Cost_per_Acre__c = finished.singleAcre;
                        this.tableProduct[index].Acres_Treated__c = finished.acresTreated;
                        //this.prodCostM = finished.singleThousand;
                        //this.prodCostA = finished.singleAcre;
                        //this.treatedAcreage = finished.acresTreated
                        //this.prodAreaCost = this.areaAcres * this.costPerAcre;
                        
                        //this.appTotalPrice = appTotal(this.tableProduct); 
                        //this.totalCostPerM = roundNum(Object.values(this.tableProduct).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                    }
                }
        }, 500)

    }

    handleUnitArea(x){
        let index = this.tableProduct.findIndex(a=> a.Product__c === x.target.name);

        this.tableProduct[index].Unit_Area__c = x.detail.value
        window.clearTimeout(this.delay);

        this.delay = setTimeout(()=>{
        if(this.tableProduct[index].Rate2__c > 0 && this.tableProduct[index].Unit_Area__c!= '100 Gal'){
             this.tableProduct[index].Units_Required__c = unitsRequired(this.tableProduct[index].Unit_Area__c, this.tableProduct[index].Rate2__c, this.areaSizeM, this.tableProduct[index].Product_Size__c );
             this.tableProduct[index].totalUsed = totalUsed(this.tableProduct[index].Unit_Area__c, this.areaSizeM, this.tableProduct[index].Rate2__c);
             this.tableProduct[index].Total_Price__c = roundNum(this.tableProduct[index].Units_Required__c * this.tableProduct[index].Unit_Price__c, 2);

             
             let prodCost = pricePerUnit(this.tableProduct[index].Unit_Price__c, this.tableProduct[index].Product_Size__c, this.tableProduct[index].Rate2__c,this.tableProduct[index].Unit_Area__c);
             this.tableProduct[index].Cost_per_M__c = prodCost.perThousand;
             this.tableProduct[index].Cost_per_Acre__c = prodCost.perAcre; 

             //this.productIds.includes(this.tableProduct[index].Product__c) ? '': this.productIds.push(this.tableProduct[index].Product__c);
            //handle updating fertilizer amounts
             if(this.tableProduct[index].isFert){
                let fert = this.tableProduct[index].Product_Type__c === 'Dry' ? compareToolDryFert(this.tableProduct[index].Rate2__c, this.tableProduct[index].Product__r, this.tableProduct[index].Unit_Area__c) : compareToolLiqFert(this.tableProduct[index].Rate2__c, this.tableProduct[index].Product__r);
                this.tableProduct[index].N__c = fert.n;
                this.tableProduct[index].P__c = fert.p;
                this.tableProduct[index].K__c = fert.k;
                
            }
            }else if(e.detail.value ==='100 Gal'){
                let {Rate2__c, Product_Size__c, Unit_Price__c, Spray_Vol_M__c, Cost_per_Acre__c} = this.tableProduct[index];
                if(Spray_Vol_M__c>0 && Rate2__c> 0){
                     let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, Unit_Price__c) 
                
                    //updateValues
                     this.tableProduct[index].Units_Required__c = lvUnits(this.areaSizeM, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                     this.tableProduct[index].Total_Price__c = roundNum(this.tableProduct[index].Units_Required__c * this.tableProduct[index].Unit_Price__c, 2); 

                     this.tableProduct[index].Cost_per_M__c = finished.singleThousand;
                     this.tableProduct[index].Cost_per_Acre__c = finished.singleAcre;

                }
            }

        })
    }

    handlePrice(x){
        let index = this.tableProduct.findIndex(a=> a.Product__c === x.target.name);

        this.tableProduct[index].price = Number(x.detail.value)
        this.tableProduct[index].Unit_Price__c = Number(x.detail.value)

        window.clearTimeout(this.delay);

        this.delay = setTimeout(()=>{
            if(this.tableProduct[index].price > 0 && this.tableProduct[index].Unit_Area__c != '100 Gal'){
                    this.tableProduct[index].Margin__c = roundNum((1 - (this.tableProduct[index].Product_Cost__c /this.tableProduct[index].Unit_Price__c))*100,2)
                    this.tableProduct[index].Total_Price__c = roundNum(this.tableProduct[index].Units_Required__c * this.tableProduct[index].Unit_Price__c,2);
                    
                    
                    let prodCost = pricePerUnit(this.tableProduct[index].Unit_Price__c, this.tableProduct[index].Product_Size__c, this.tableProduct[index].Rate2__c,this.tableProduct[index].Unit_Area__c);
                    
                    this.tableProduct[index].Cost_per_M__c = prodCost.perThousand;
                    this.tableProduct[index].Cost_per_Acre__c = prodCost.perAcre; 

                }else if(this.tableProduct[index].Unit_Price__c > 0 && this.tableProduct[index].Unit_Area__c === '100 Gal'){
                    let {Rate2__c, Product_Size__c, Spray_Vol_M__c} = this.tableProduct[index];

                    this.tableProduct[index].Margin__c = roundNum((1 - (this.tableProduct[index].Product_Cost__c /this.tableProduct[index].Unit_Price__c))*100,2)

                    if(Spray_Vol_M__c>0 && Rate2__c> 0){
                        let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, this.tableProduct[index].Unit_Price__c) 
                   
                       //updateValues
                        this.tableProduct[index].Units_Required__c = lvUnits(this.areaSizeM, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                        this.tableProduct[index].Total_Price__c = roundNum(this.tableProduct[index].Units_Required__c * this.tableProduct[index].Unit_Price__c, 2); 
   
                        this.tableProduct[index].Cost_per_M__c = finished.singleThousand;
                        this.tableProduct[index].Cost_per_Acre__c = finished.singleAcre;
                        this.prodCostM = finished.singleThousand;;
                        this.prodCostA = finished.singleAcre;
                        //this.prodAreaCost = this.areaAcres * this.costPerAcre;
                        //this.treatedAcreage = areaTreated(this.tableProduct[index].Product_Size__c,this.tableProduct[index].Rate2__c, this.tableProduct[index].Unit_Area__c );
   
                   }
                }else{
                    this.tableProduct[index].Margin__c = 0;                
                    this.tableProduct[index].Margin__c = roundNum(this.tableProduct[index].Margin__c, 2);
                    this.tableProduct[index].Total_Price__c = roundNum(this.tableProduct[index].Units_Required__c * this.tableProduct[index].Unit_Price__c,2)
                    
                    let costs = perProduct(this.tableProduct[index].Total_Price__c, this.tableProduct[index].Product_Size__c, this.tableProduct[index].Rate2__c, this.tableProduct[index].Unit_Area__c);
                    let prodCost = pricePerUnit(this.tableProduct[index].Unit_Price__c, this.tableProduct[index].Product_Size__c, this.tableProduct[index].Rate2__c,this.tableProduct[index].Unit_Area__c);
                    
                    this.tableProduct[index].Cost_per_M__c = prodCost.perThousand;
                    this.tableProduct[index].Cost_per_Acre__c = prodCost.perAcre; 
                    
                    this.prodCostM = prodCost.perThousand 
                    this.prodCostA = costs.perAcre;
                    this.prodAreaCost = this.areaAcres * this.tableProduct[index].costA; 
                    this.appTotalPrice = appTotal(this.tableProduct);
                    this.totalCostPerM = roundNum(this.appTotalPrice/(this.areaSizeM/1000),2); 
                }

                }, 1000)
    }
}