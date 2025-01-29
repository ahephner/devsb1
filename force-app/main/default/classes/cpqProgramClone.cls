public class cpqProgramClone {
    //to return new id and applications for later logic 
    public class returnWrapper{
        @AuraEnabled public string programId;
        @AuraEnabled public list<Application__c> backApps; 
    }
    
@AuraEnabled(cacheable=true)
    public static string isOwner(string recId){
        String accountOwner = [select Account__r.OwnerId from program__c where id =: recId limit 1].Account__r.OwnerId; 
        return accountOwner; 
    }    
@AuraEnabled
    public static returnWrapper cpqProgramCloneStep1(string recId, boolean newAccount, string accountId){
        
        SavePoint sp = Database.setSavepoint();
         
        string err;
        string newProgramId; 
        List<Application__c> apps = new List<Application__c>();
        Program__c newPro;
        try{
           
            //get program
         Program__c oldPro = [select name, Account__c, year__c from Program__c where id = :recId]; 
			
            newPro = oldPro.clone(false); 
            newPro.Name += ' Cloned'; 
            if(newAccount==false){
                newPro.Account__c = accountId; 
            }
           insert newPro; 
            newProgramId = newPro.Id;
            
            if(newPro.id != null){
    			List<Area__c> areaCopy = new List<Area__c>();
     
                    for(Area__c a1 : [Select x.id, x.name, x.Area_Acres__c, x.Area_K_Total__c,x.Area_N_Total__c,  
                      x.Area_P_Total__c,x.Area_Sq_Feet__c,x.Date__c, x.Type__c, x.PrevID__c, Pref_U_of_M__c 
                      from area__c x where program__c = :recId]){ 
                        Area__c na = a1.clone(false);
                        na.Program__c  = newPro.id;
                        na.PrevID__c = a1.id; 
                        areaCopy.add(na);
                      }

    insert areaCopy; 
    
    for(area__c j: areaCopy){
        for(application__c ap : [select a.Id, a.Name, a.Area__c, a.repeat__c, a.Note__c , a.Clone__c, 
                                a.Date__c,  a.Weeks_Apart__c, a.Number_of_Apps__c, a.Prev_App_Id__c, Program_ID__c
                                 from Application__c a where a.area__c = :j.previd__c]){
                                    Application__c newApp = ap.clone(false); 
                                    newApp.area__c = j.Id;
                                    newApp.Prev_App_Id__c = ap.Id; 
                                    newApp.Clone__c = True; 
                                    apps.add(newApp);
                                 }
    }
    insert apps; 

}
        }catch(exception e){
            Database.rollback(sp);
            err = string.valueOf(e); 
        }
        returnWrapper bw = new returnWrapper();
        bw.programId = newPro.Id;
        bw.backApps = apps; 
      
        return bw; 
    }

    @AuraEnabled
    public static string cloneProducts(string JSONSTRING){
         //system.debug('data in ' +JSONSTRING); 
         string retMess = 'success'; 
         Map<String, String> appId = new Map<String, String>(); 
         List<App_Product__c> ListCloneProds = new List<App_Product__c>(); 
         JSONParser parser = JSON.createParser(JSONSTRING); 
                    
        while(parser.nextToken() != null){
        	if(parser.getCurrentToken() == JSONToken.START_ARRAY){
            	while(parser.nextToken() != null){
                	//system.debug('current name' + parser.getCurrentName() + ' current token' + parser.getCurrentToken());
                    if(parser.getCurrentToken() == JSONToken.START_OBJECT){
                    	application__c temp = (application__c)parser.readValueAs(application__c.class);
                        appId.put(temp.Prev_App_Id__c, temp.Id);
             
                        parser.skipChildren();
                     }
                }
           }   
        } 
     try{
         //system.debug('parser '+appId.keySet());
        List<App_Product__c> prod = new List<App_Product__c>([SELECT Name, Application__c, Cost_per_Acre__c, Cost_per_M__c, 
                                 							       K__c, LBS_ACRE__c, Margin__c, N__c, Note__c, Note_Other__c, 
                                 							       OZ_M__c, P__c, Product__c, Rate2__c, Unit_Area__c, Unit_Cost__c, 
                                           					       Unit_Price__c, Units_Required__c FROM App_Product__c 
                                                                   where Application__c in: appId.keySet()]);
                    //system.debug('apps ---');
                    //system.debug(prod);
         for(App_Product__c x: prod){
             App_Product__c clonedProd = x.clone(false);	
             	clonedProd.Application__c = appId.get(x.Application__c); 
             	ListCloneProds.add(clonedProd); 
         }
         
         if(ListCloneProds.size()> 1){
             insert ListCloneProds; 
         }
     }catch(Exception e){
        retMess = String.valueOf(e);
     }
       return retMess;
  }
        @AuraEnabled
    public static string cloneProductsWithPriceBooks(string JSONSTRING, list<string> priceBookIds){
         system.debug('data in cloneProductsWithPriceBooks'); 
         string retMess = 'success'; 
         Map<String, String> appId = new Map<String, String>(); 
         List<App_Product__c> ListCloneProds = new List<App_Product__c>(); 
         JSONParser parser = JSON.createParser(JSONSTRING); 
                    
        while(parser.nextToken() != null){
        	if(parser.getCurrentToken() == JSONToken.START_ARRAY){
            	while(parser.nextToken() != null){
                	//system.debug('current name' + parser.getCurrentName() + ' current token' + parser.getCurrentToken());
                    if(parser.getCurrentToken() == JSONToken.START_OBJECT){
                    	application__c temp = (application__c)parser.readValueAs(application__c.class);
                        appId.put(temp.Prev_App_Id__c, temp.Id);
             
                        parser.skipChildren();
                     }
                }
           }   
        } 
     try{
         //system.debug('parser '+appId.keySet());
        List<App_Product__c> prod = new List<App_Product__c>([SELECT Name, Application__c, Cost_per_Acre__c, Cost_per_M__c, 
                                 							       K__c, LBS_ACRE__c, Margin__c, N__c, Note__c, Note_Other__c, 
                                 							       OZ_M__c, P__c, Product__c, Rate2__c, Unit_Area__c, Unit_Cost__c, 
                                           					       Unit_Price__c, Units_Required__c, altPriceBookEntryId__c,
                                                              	   altPriceBookId__c, altPriceBookName__c, Product__r.Size__c 
                                                              	   FROM App_Product__c 
                                                                   where Application__c in: appId.keySet()]);
                    //system.debug('apps ---');
                    //system.debug(prod);
         for(App_Product__c x: prod){
             App_Product__c clonedProd = x.clone(false);
             	list<pricebookentry> pbInfo = getPriceBooks.priorityBestPrice(priceBookIds, x.Product__c); 
             	clonedProd.altPriceBookEntryId__c = pbInfo[0].Id;
             	clonedProd.altPriceBookId__c = pbInfo[0].Pricebook2Id;
             	clonedProd.altPriceBookName__c = pbInfo[0].Pricebook2.Name; 
             	clonedProd.Unit_Price__c = pbInfo[0].UnitPrice;
             	clonedProd.Margin__c = pbInfo[0].List_Margin__c;
             	//set cost per acre per thousand
             	costCals costs = cpqProgramClone.calcAcreCharge(pbInfo[0].UnitPrice,x.Product__r.Size__c, x.Rate2__c,x.Unit_Area__c);
             	clonedProd.Cost_per_Acre__c = costs.costPerAcre;
             	clonedProd.Cost_per_M__c = costs.costPerM; 
             	clonedProd.Application__c = appId.get(x.Application__c); 
             	ListCloneProds.add(clonedProd); 
         }
         
         if(ListCloneProds.size()> 1){
             insert ListCloneProds; 
         }
     }catch(Exception e){
        retMess = String.valueOf(e);
     }
       return retMess;
  }
    @AuraEnabled
    public static string cloneSingleApp(string appId, Date copyDate, string aId){
        string messBack; 
        try{
            Application__c newApp = new Application__c(); 
            List<App_Product__c> ListCloneProds = new List<App_Product__c>(); 
            Application__c ogApp = [SELECT Number_of_Apps__c, Name, Area__c, Child_Application__c, 
                                    Clone__c, Date__c, Application_K_Total__c, Month__c, Multi_Application__c, 
                                    Application_N_Total__c, Note__c, Application_P_Total__c, Parent_Application__c, Prev_App_Id__c, 
                                    Product_List__c, Repeat__c, Converted__c,
                                    Total_Units__c, Week__c, Weeks_Apart__c FROM Application__c WHERE Id =: appId limit 1];
            
            newApp = ogApp.clone(false, false, false, false); 
            newApp.Name = newApp.Name + ' c';
            newApp.Date__c = copyDate; 
            newApp.Area__c = aId; 
            newApp.Converted__c = false; 
            insert newApp; 
            id idForAppProduct = newApp.Id; 
            
            //get products
             List<App_Product__c> prod = new List<App_Product__c>([SELECT Name, Application__c, Cost_per_Acre__c, Cost_per_M__c, 
                                 							       K__c, LBS_ACRE__c, Margin__c, N__c, Note__c, Note_Other__c, 
                                 							       OZ_M__c, P__c, Product__c, Rate2__c, Unit_Area__c, Unit_Cost__c, 
                                           					       Unit_Price__c, Units_Required__c FROM App_Product__c 
                                                                   where Application__c =: appId]);
            system.debug('new id '+ idForAppProduct); 
         for(App_Product__c x: prod){
             	system.debug('for app '+x);
                App_Product__c clonedProd = x.clone(false);	
             	clonedProd.Application__c = idForAppProduct;  
             	ListCloneProds.add(clonedProd); 
         }
         
         if(ListCloneProds.size()>= 1){
             insert ListCloneProds;
             messBack = 'success'; 
         }
        }catch(exception e){
            messBack = string.valueof(e); 
        }
        
        //string messBack = 'appId '+appId + ' Date: '+copyDate; 
        //string messBack = 'hello from apex'; 
        return messBack;
    }
    
    public class costCals{
        public Decimal costPerAcre {get;set;}
        public Decimal costPerM {get;set;}
    }
    private static costCals calcAcreCharge(Decimal productPrice, 
                                   Decimal unitSize, 
                                   Decimal prodRate, 
                                   string unitOfMeasure){
        costCals costs = new costCals();
        Decimal acreCharge; 
        Decimal mCharge;                                
        Decimal priceOfUnit = productPrice/unitSize;
                                      // system.debug('UnitSize '+unitSize + ' rate '+prodRate); 
                                       //system.debug('priceOfUnit '+priceOfUnit + ' math '+priceOfUnit *prodRate);
                                       if(unitofMeasure.contains('Acre')){
                                           	   acreCharge = priceOfUnit *prodRate;
                                           	   mCharge = (prodRate/43.56)*priceOfUnit; 
                                       	//system.debug('per acre '+acreCharge);
                                       }else{
                                           //system.debug('per thousand');
                                           	   acreCharge = priceOfUnit * (prodRate *43.56);
                                           	   mCharge = priceOfUnit * prodRate;
                                       }
        costs.costPerAcre = acreCharge.setScale(2);
        costs.costPerM = mCharge.setScale(2);                                
        return costs; 
    }
}