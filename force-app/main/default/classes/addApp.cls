public with sharing class addApp {
    @AuraEnabled 
      public static Application__c addApplication(appWrapper wrapper){
          Application__c app = new Application__c(); 
          app.Name = wrapper.appName; 
          app.Area__c = wrapper.appArea;
          app.Date__c = date.valueof(wrapper.appDate); 
          app.Note__c = wrapper.appNote;
          app.Parent_Application__c = wrapper.parentApp;
          app.Direct_Ship__c = wrapper.ds; 
          app.Spray_Vol_Meas__c = wrapper.measurement;
          app.Spray_Vol__c = wrapper.volume;
          app.Tank_Size__c = wrapper.tankSize;
          insert app; 
          return app; 
      }
      @AuraEnabled
      public static List<App_Product__c> addProducts(string products){
           List<App_Product__c> prodList = new List<App_Product__c>(); 
          JSONParser parser = JSON.createParser(products); 
          while(parser.nextToken() != null){
              if(parser.getCurrentToken() == JSONToken.START_ARRAY){
                  while(parser.nextToken() != null){
                      //system.debug('current name' + parser.getCurrentName() + ' current token' + parser.getCurrentToken());
                      if(parser.getCurrentToken() == JSONToken.START_OBJECT){
                          App_Product__c ap = new App_Product__c();
                          App_Product__c temp = (App_Product__c)parser.readValueAs(App_Product__c.class);
                          system.debug('temp ' + temp.Unit_Cost__c);
                          if(temp.Application__c != null){
                             //ap.Id = temp.Id;
                             ap.Product__c = temp.Product__c;
                             ap.Application__c = temp.Application__c; 	
                             ap.Rate2__c = temp.Rate2__c;
                             ap.Note__c = temp.Note__c; 
                             ap.Unit_Area__c = temp.Unit_Area__c;
                             ap.Unit_Cost__c = temp.Unit_Cost__c; 
                             ap.Unit_Price__c = temp.Unit_Price__c; 
                             ap.Margin__c = temp.Margin__c;
                             ap.Cost_per_M__c = temp.Cost_per_M__c;
                             ap.Cost_per_Acre__c = temp.Cost_per_Acre__c; 
                             ap.Units_Required__c = temp.Units_Required__c;
                             ap.N__c = temp.N__c;
                             ap.P__c = temp.P__c;
                             ap.K__c = temp.K__c;
                             ap.Cost_per_100__c = temp.Cost_per_100__c;
                             ap.Cost_per_Gallon__c = temp.Cost_per_Gallon__c;
                             ap.isLowVol__c = temp.isLowVol__c;
                             ap.Spray_Vol_M__c = temp.Spray_Vol_M__c;  
                             ap.Acres_Treated__c = temp.Acres_Treated__c; 
                             ap.altPriceBookName__c = temp.altPriceBookName__c;
                             ap.altPriceBookId__c = temp.altPriceBookId__c; 
                             ap.altPriceBookEntryId__c = temp.altPriceBookEntryId__c;  
                             ap.Note__c = temp.Note__c;
                             ap.Note_Other__c = temp.Note_Other__c; 
                             ap.Manual_Charge_Size__c = temp.Manual_Charge_Size__c; 
                             prodList.add(ap);
                          }
                         
                          parser.skipChildren();
                      }
                  }
              }   
          } 
          if(!prodList.isempty()){
              insert prodList; 
          }
          return null;  
      }
      //Updates applications
      //the Area update is not in this iteration
      @AuraEnabled 
      public static Application__c updateApplication(appWrapper wrapper, string id, boolean newNote){
          Application__c app = [select Name, Area__c, Date__c, Note__c, Direct_Ship__c,
                                Spray_Vol_Meas__c, Spray_Vol__c,Tank_Size__c from Application__c where id =: id]; 
          system.debug('newNote '+newNote);
          if(app.Name	!= wrapper.appName || app.date__c != wrapper.appDate || newNote || 
             wrapper.ds!=app.Direct_Ship__c||wrapper.measurement	!= app.Spray_Vol_Meas__c ||
            wrapper.volume != app.Spray_Vol__c || wrapper.tankSize != app.Tank_Size__c){
              app.Name = wrapper.appName;
              app.Date__c = wrapper.appDate;
              app.Note__c = wrapper.appNote;  
              app.Direct_Ship__c = wrapper.ds; 
              app.Spray_Vol_Meas__c = wrapper.measurement;
              app.Spray_Vol__c = wrapper.volume;
              app.Tank_Size__c = wrapper.tankSize;
             // app.Area__c = wrapper.appArea; 
          }
          update(app); 
          system.debug('app '+app);
          return app; 
          
      }
  //@AuraEnabled
      //   public static List<Application_Product__c> updateProducts(string products){
      //        List<Application_Product__c> prodList = new List<Application_Product__c>(); 
      //       JSONParser parser = JSON.createParser(products); 
      //       while(parser.nextToken() != null){
      //           if(parser.getCurrentToken() == JSONToken.START_ARRAY){
      //               while(parser.nextToken() != null){
      //                   //system.debug('current name' + parser.getCurrentName() + ' current token' + parser.getCurrentToken());
      //                   if(parser.getCurrentToken() == JSONToken.START_OBJECT){
      //                       application_product__c ap = new application_product__c();
      //                       application_product__c temp = (application_product__c)parser.readValueAs(application_product__c.class);
      //                       system.debug('temp ' + temp);
      //                       if(temp.Application__c != null){
      //                          ap.Id = temp.Id;
      //                          //ap.Product__c = temp.product__c;
      //                          //ap.Application__c = temp.Application__c; 	
      //                          ap.Rate2__c = temp.Rate2__c;
      //                          ap.Margin__c = temp.Margin__c; 
      //                          //ap.Unit_Area__c = temp.Unit_Area__c; 
      //                          //ap.Note__c = temp.Note__c;
      //                          ap.Unit_Price__c = temp.Unit_Price__c;  
      //                           //system.debug('product id '+ ap.Id);
      //                           prodList.add(ap);
      //                       }
                           
      //                       parser.skipChildren();
      //                   }
      //               }
      //           }   
      //       } 
      //       if(!prodList.isempty()){
      //           upsert prodList; 
      //       }
      //       return null;  
      //   }
      @AuraEnabled
      public static string updateProducts(List<App_Product__c> products){
         
          List<App_Product__c> toInsert = new List<App_Product__c>();
          
          for(App_Product__c x : products){
              App_Product__c li = new App_Product__c();
              if(String.isBlank(x.Id)){
                  li.Product__c = x.Product__c;
                  li.Rate2__c = x.Rate2__c;
                  li.Application__c = x.Application__c;
                  li.Units_Required__c = x.Units_Required__c;
                  li.Unit_Area__c = x.Unit_Area__c;
                  li.Unit_Price__c = x.Unit_Price__c;
                  li.Margin__c = x.Margin__c;
                  li.Unit_Cost__c = x.Unit_Cost__c;
                  li.Cost_per_Acre__c = x.Cost_per_Acre__c;
                  li.Cost_per_M__c = x.Cost_per_M__c;
                  li.Note__c = x.Note__c;
                  li.N__c = x.N__c;
                  li.P__c = x.P__c;
                  li.K__c = x.K__c;
                  li.isLowVol__c = x.isLowVol__c;
                  li.Spray_Vol_M__c = x.Spray_Vol_M__c;
                  li.Acres_Treated__c = x.Acres_Treated__c; 
                  li.altPriceBookName__c = x.altPriceBookName__c;
                  li.altPriceBookId__c = x.altPriceBookId__c; 
                  li.altPriceBookEntryId__c = x.altPriceBookEntryId__c; 
                  li.Note_Other__c = x.Note_Other__c;
                  li.Manual_Charge_Size__c = x.Manual_Charge_Size__c;
                  li.Cost_per_100__c = x.Cost_per_100__c;
                  li.Cost_per_Gallon__c = x.Cost_per_Gallon__c;
                  //toInsert.add(li);
              }else{
                  system.debug('old product '+x.Id);
                  li.Id = x.Id; 
                  //li.Application__c = x.Application__c;
                  li.Rate2__c = x.Rate2__c;
                  li.Unit_Area__c = x.Unit_Area__c;
                  li.Units_Required__c = x.Units_Required__c;
                  li.Unit_Price__c = x.Unit_Price__c;
                  li.Margin__c = x.Margin__c;
                  li.Unit_Cost__c = x.Unit_Cost__c;
                  li.Cost_per_Acre__c = x.Cost_per_Acre__c;
                  li.Cost_per_M__c = x.Cost_per_M__c;
                  li.Note__c = x.Note__c;
                  li.N__c = x.N__c;
                  li.P__c = x.P__c;
                  li.K__c = x.K__c;
                  li.isLowVol__c = x.isLowVol__c;
                  li.Spray_Vol_M__c = x.Spray_Vol_M__c;
                  li.altPriceBookName__c = x.altPriceBookName__c;
                  li.altPriceBookId__c = x.altPriceBookId__c; 
                  li.Acres_Treated__c = x.Acres_Treated__c; 
                  li.altPriceBookEntryId__c = x.altPriceBookEntryId__c; 
                  li.Note_Other__c = x.Note_Other__c;
                  li.Manual_Charge_Size__c = x.Manual_Charge_Size__c;
                  li.Cost_per_100__c = x.Cost_per_100__c;
                  li.Cost_per_Gallon__c = x.Cost_per_Gallon__c;
              }
              toInsert.add(li);
          }
          string mess; 
          try{
              Database.UpsertResult[] res = Database.upsert(toInsert);
              mess = 'success';
          }catch(exception x){
              mess = string.valueOf(x);
          }
          
          return mess; 
      }
  
      @AuraEnabled
      public static void multiInsert(id appId, integer occurance, integer daysBetween){
          list<Application__c> appsToInsert = new list<application__c>();
          list<App_Product__c> prodsToInsert = new list<App_Product__c>();
          integer appNumber = 1; 
         
          //get orginial app
          application__c app = [select id, area__c, name,
                                 date__c from application__c 
                                 where id =:appId];
          
          list<App_Product__c> ogProd = [select id, product__c, rate2__c, Application__c,
                                                 Unit_Area__c,Unit_Price__c,margin__c, units_required__c, 
                                                    N__c, P__c, K__c, Note__c, Cost_per_Acre__c,Cost_per_M__c,isLowVol__c, Spray_Vol_M__c
                                         from App_Product__c where Application__c =: appId];
        
          for(integer i = 1; i<= occurance; i++){
              integer days = daysBetween * i;
              application__c clonedApp = app.clone(false); 
              clonedApp.prev_app_id__c = appId; 
              clonedApp.date__c = app.date__c.addDays(days); 
              clonedApp.clone__c = True; 
              clonedApp.Parent_Application__c = false;
              clonedApp.Child_Application__c = true; 
              appNumber += 1; 
              clonedApp.name = app.name +' '+ appNumber;  
              
              appsToInsert.add(clonedApp); 
  
          }
          try{
              Database.SaveResult[] srList = Database.insert(appsToInsert, false);
              system.debug('apps inserted '+srList); 
              for(Database.SaveResult sr :srList){
                  id newApp = sr.getId();
                  system.debug('id '+newApp);
                  
                  for(App_Product__c ap: ogProd){
                      App_Product__c x = new App_Product__c();
                      x.Application__c = newApp;
                      x.Product__c = ap.Product__c;
                      x.Rate2__c = ap.Rate2__c;
                      x.Unit_Area__c = ap.Unit_Area__c;
                      x.Unit_Price__c = ap.Unit_Price__c;
                      x.Margin__c = ap.Margin__c;
                      x.Cost_per_Acre__c = ap.Cost_per_Acre__c;
                      x.Cost_per_M__c = ap.Cost_per_M__c;
                      x.Units_Required__c = ap.Units_Required__c;
                      x.N__c = ap.N__c;
                      x.P__c = ap.P__c;
                      x.K__c = ap.K__c;
                      x.isLowVol__c = ap.isLowVol__c;
                      x.Spray_Vol_M__c = ap.Spray_Vol_M__c; 
                      x.Note__c = ap.Note__c;
                      prodsToInsert.add(x);
                  }
              }
              system.debug('prodsToInsert '+ prodsToInsert);
              Database.SaveResult[] products = Database.insert(prodsToInsert, false); 
          }catch(exception e){
              system.debug(e.getMessage());
          }
               //return null; 
      }
      
      @AuraEnabled
      public static string multiUpdateProd(List<String> prodIds,Date appDate, string parentId, string currentRecId, boolean parentAp, string updateType,string area, string program ){
          Map<Id, App_Product__c> changedApp = new Map<Id,App_Product__c>();
          List<App_Product__c> appProds = new List<App_Product__c>(); 
          List<App_Product__c> updatedProducts = new List<App_Product__c>();
          string messBack = 'success'; 
          List<App_Product__c> curRec = [select id, Rate2__c,Unit_Price__c,Margin__c, Cost_per_Acre__c, Cost_per_M__c,
                                           Application__r.Date__c, Product__c, Unit_Area__c, Product__r.Name
                                           from app_product__c where Product__c in :prodIds and application__c =:currentRecId];
          if(updateType == 'series'){
                   if(!parentAp){
                          appProds = [select id, Rate2__c,Unit_Price__c,Margin__c,product__r.name, Cost_per_Acre__c, Cost_per_M__c,
                                           Application__r.Date__c, Product__c, Unit_Area__c, application__r.name, isLowVol__c, Spray_Vol_M__c
                                           from app_product__c where application__r.Date__c > :appDate
                                           and Product__c in :prodIds and application__r.prev_app_id__c =:parentId 
                                           order by Application__r.Date__c ASC];
                  }else{
                          appProds = [select id, Rate2__c,Unit_Price__c,Margin__c,product__r.name, Cost_per_Acre__c, Cost_per_M__c,
                                          Application__r.Date__c, Product__c, Unit_Area__c, application__r.name, isLowVol__c, Spray_Vol_M__c
                                          from app_product__c where application__r.Date__c > :appDate
                                          and Product__c in :prodIds and application__r.prev_app_id__c =:currentRecId];
                  }  
          }else if(updateType == 'area'){
                      appProds = [select id, Rate2__c,Unit_Price__c,Margin__c,product__r.name, Cost_per_Acre__c, Cost_per_M__c,
                                          Application__r.Date__c, Product__c, Unit_Area__c, application__r.name, isLowVol__c, Spray_Vol_M__c
                                          from app_product__c where Product__c in :prodIds and Area_Id__c  =:area 
                                          and (NOT application__c =:currentRecId)];
              
          }else if(updateType == 'program'){
                      appProds = [select id, Rate2__c,Unit_Price__c,Margin__c,product__r.name, Cost_per_Acre__c, Cost_per_M__c,
                                          Application__r.Date__c, Product__c, Unit_Area__c, application__r.name, isLowVol__c, Spray_Vol_M__c
                                          from app_product__c where Product__c in :prodIds and Application__r.Program_ID__c =:program 
                                          and (Not application__c =:currentRecId)];
          }
    
  
          
          //need to control and only get top values
          for(App_Product__c ap: curRec){
              changedApp.put(ap.Product__c, ap); 
          }
              
          for(integer i = 0; i < appProds.size(); i++){
              appProds[i].Rate2__c = changedApp.get(appProds[i].Product__c).Rate2__c;
              appProds[i].Unit_Area__c = changedApp.get(appProds[i].Product__c).Unit_Area__c;
              appProds[i].Margin__c = changedApp.get(appProds[i].Product__c).Margin__c;
              appProds[i].Unit_Price__c = changedApp.get(appProds[i].Product__c).Unit_Price__c;
              appProds[i].Cost_per_Acre__c = changedApp.get(appProds[i].Product__c).Cost_per_Acre__c;
              appProds[i].Cost_per_M__c = changedApp.get(appProds[i].Product__c).Cost_per_M__c;
              updatedProducts.add(appProds[i]);
          }
          
          upsert updatedProducts; 
          return messBack; 
      }
  
  }