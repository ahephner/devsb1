@isTest
public class test_cpqProgramClone {
	
    @isTest
    static void test_cpqProgramCloneStep1(){
        //date
        Date myDate = Date.newInstance(2040, 1, 4);
        
        // setup a new account
        Account cust = new Account();
        cust.Name = 'Test123456';
       	cust.Type = 'Customer';
       	cust.Customer_Name__c = 'Test Customer 123456';
       	insert cust;
     	
        //create
        Program__c program = new Program__c(Name = 'My Program', Account__c = cust.id);
           insert program;
        
        //products
        Product2 r1 = new Product2();
        r1.Name='Product 1';
        r1.Primary_Category__c = 'Chemicals';
        r1.Subcategory__c ='Herbicide - Premium';
        r1.Include_in_Programs__c = True;
        r1.IsActive= True; 
        r1.ProductCode='123';
        r1.Product_Status__c ='Stock';
        r1.Size__c = 1;
        r1.Floor_Type__c ='Floor'; 
        r1.Floor_Price__c = 100;
        
        Product2 r2 = new Product2();
        r2.Name='Product 2';
        r2.Primary_Category__c = 'Chemicals';
        r2.Subcategory__c = 'Fungicide';
        r2.Include_in_Programs__c = True;
        r2.IsActive= True; 
        r2.ProductCode='123';
        r2.Product_Status__c ='Stock';
        r2.Size__c = 1;
        r2.Floor_Type__c ='Floor'; 
        r2.Floor_Price__c = 100;
     	
        insert r1; 
     	insert r2;
        
        //pricebook
        Id pricebookId = Test.getStandardPricebookId();
        
        //price book entries
		PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r1.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
        PricebookEntry pbe2 = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r2.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
		insert pbe;
        insert pbe2;
        
        //area
        Area__c area = new Area__c(name = 'Greens', Program__c = Program.Id, Account__c = cust.id, Area_Acres__c = 1000);
    	insert area;
        
        //application
        Application__c app1 = new Application__c(Name='test app', Area__c = Area.id, Date__c = myDate);
        Application__c app2 = new Application__c(Name='test app 2', Area__c = Area.id, Date__c = myDate);
		insert app1;
        insert app2;
        //app products
        //insert app product
    	App_Product__c ap1 = new App_Product__c(Application__c = app1.Id, Product__c= r1.id, Oz_M__c =1,
                                                Unit_Price__c = 100, Unit_Cost__c = 23, Units_Required__c = 1,Margin__c = 23 );
    	App_Product__c ap2 = new App_Product__c(Application__c = app1.Id, Product__c= r2.id, Oz_M__c =1,
                                                Unit_Price__c = 100, Unit_Cost__c = 23, Units_Required__c = 1,Margin__c = 23 );    
        insert ap1;
        insert ap2;
        
        //insert app product
    	App_Product__c ap3 = new App_Product__c(Application__c = app2.Id, Product__c= r1.id, Oz_M__c =1,
                                                Unit_Price__c = 100, Unit_Cost__c = 23, Units_Required__c = 1,Margin__c = 23 );
    	App_Product__c ap4 = new App_Product__c(Application__c = app2.Id, Product__c= r2.id, Oz_M__c =1,
                                                Unit_Price__c = 100, Unit_Cost__c = 23, Units_Required__c = 1,Margin__c = 23 );    
        insert ap3;
        insert ap4;
        
        test.startTest();
        	cpqProgramClone.returnWrapper x = cpqProgramClone.cpqProgramCloneStep1(Program.Id, true, '');
        	string accBack = cpqProgramClone.isOwner(program.id);
        	string backApps = JSON.serialize(x.backApps); 
        	string y = cpqProgramClone.cloneProducts(backApps);
        test.stopTest();
    }
    @isTest
    static void test_singleClone(){
                //date
        Date myDate = Date.newInstance(2040, 1, 4);
        
        // setup a new account
        Account cust = new Account();
        cust.Name = 'Test123456';
       	cust.Type = 'Customer';
       	cust.Customer_Name__c = 'Test Customer 123456';
       	insert cust;
     	
        //create
        Program__c program = new Program__c(Name = 'My Program', Account__c = cust.id);
           insert program;
        
        //products
        Product2 r1 = new Product2();
        r1.Name='Product 1';
        r1.Primary_Category__c = 'Chemicals';
        r1.Subcategory__c ='Herbicide - Premium';
        r1.Include_in_Programs__c = True;
        r1.IsActive= True; 
        r1.ProductCode='123';
        r1.Product_Status__c ='Stock';
        r1.Size__c = 1;
        r1.Floor_Type__c ='Floor'; 
        r1.Floor_Price__c = 100;
        
        Product2 r2 = new Product2();
        r2.Name='Product 2';
        r2.Primary_Category__c = 'Chemicals';
        r2.Subcategory__c = 'Fungicide';
        r2.Include_in_Programs__c = True;
        r2.IsActive= True; 
        r2.ProductCode='123';
        r2.Product_Status__c ='Stock';
        r2.Size__c = 1;
        r2.Floor_Type__c ='Floor'; 
        r2.Floor_Price__c = 100;
     	
        insert r1; 
     	insert r2;
        
        //pricebook
        Id pricebookId = Test.getStandardPricebookId();
        
        //price book entries
		PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r1.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
        PricebookEntry pbe2 = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r2.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
		insert pbe;
        insert pbe2;
        
        //area
        Area__c area = new Area__c(name = 'Greens', Program__c = Program.Id, Account__c = cust.id, Area_Acres__c = 1000);
    	insert area;
        
        //application
        Application__c app1 = new Application__c(Name='test app', Area__c = Area.id, Date__c = myDate);
        Application__c app2 = new Application__c(Name='test app 2', Area__c = Area.id, Date__c = myDate);
		insert app1;
        insert app2;
        //app products
        //insert app product
    	App_Product__c ap1 = new App_Product__c(Application__c = app1.Id, Product__c= r1.id, Oz_M__c =1,
                                                Unit_Price__c = 100, Unit_Cost__c = 23, Units_Required__c = 1,Margin__c = 23 );
    	App_Product__c ap2 = new App_Product__c(Application__c = app1.Id, Product__c= r2.id, Oz_M__c =1,
                                                Unit_Price__c = 100, Unit_Cost__c = 23, Units_Required__c = 1,Margin__c = 23 );    
        insert ap1;
        insert ap2;
        
        //insert app product
    	App_Product__c ap3 = new App_Product__c(Application__c = app2.Id, Product__c= r1.id, Oz_M__c =1,
                                                Unit_Price__c = 100, Unit_Cost__c = 23, Units_Required__c = 1,Margin__c = 23 );
    	App_Product__c ap4 = new App_Product__c(Application__c = app2.Id, Product__c= r2.id, Oz_M__c =1,
                                                Unit_Price__c = 100, Unit_Cost__c = 23, Units_Required__c = 1,Margin__c = 23 );    
        insert ap3;
        insert ap4;
        
        //new date
        Date newDate = Date.newInstance(2045, 1, 4);
        test.startTest();
        	String x = cpqProgramClone.cloneSingleApp(app1.Id, newDate, area.Id);
        test.stopTest();
    }
    
    @isTest
    static void test_cloneProductsWithPriceBooks(){
                        //date
        Date myDate = Date.newInstance(2040, 1, 4);
        
        // setup a new account
        Account cust = new Account();
        cust.Name = 'Test123456';
       	cust.Type = 'Customer';
       	cust.Customer_Name__c = 'Test Customer 123456';
       	insert cust;
     	
        //create
        Program__c program = new Program__c(Name = 'My Program', Account__c = cust.id);
           insert program;
        
        //products
        Product2 r1 = new Product2();
        r1.Name='Product 1';
        r1.Primary_Category__c = 'Chemicals';
        r1.Subcategory__c ='Herbicide - Premium';
        r1.Include_in_Programs__c = True;
        r1.IsActive= True; 
        r1.ProductCode='123';
        r1.Product_Status__c ='Stock';
        r1.Size__c = 1;
        r1.Floor_Type__c ='Floor'; 
        r1.Floor_Price__c = 100;
        
        Product2 r2 = new Product2();
        r2.Name='Product 2';
        r2.Primary_Category__c = 'Chemicals';
        r2.Subcategory__c = 'Fungicide';
        r2.Include_in_Programs__c = True;
        r2.IsActive= True; 
        r2.ProductCode='123';
        r2.Product_Status__c ='Stock';
        r2.Size__c = 1;
        r2.Floor_Type__c ='Floor'; 
        r2.Floor_Price__c = 100;
     	
        insert r1; 
     	insert r2;
        
        //pricebook
        Id pricebookId = Test.getStandardPricebookId();
        
        //price book entries
		PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r1.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
        PricebookEntry pbe2 = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r2.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
		insert pbe;
        insert pbe2;
        //custom
        PriceBook2 pb2=new PriceBook2();
        pb2.Name = 'book one';
        pb2.IsActive = true;
        insert pb2; 
        //custom 3
        PriceBook2 pb3=new PriceBook2();
        pb3.Name = 'book 2';
        pb3.IsActive = true;
        insert pb3;

        //pricebook entry        
        PricebookEntry custom2 = new PricebookEntry(Pricebook2Id = pb2.Id, Product2Id=r1.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
        
        PricebookEntry pbe3 = new PricebookEntry(Pricebook2Id = pb3.Id, Product2Id=r2.id,
                                                 unitprice=110, IsActive = True, UseStandardPrice=False);
        insert custom2; 
        insert pbe3; 
        //area
        Area__c area = new Area__c(name = 'Greens', Program__c = Program.Id, Account__c = cust.id, Area_Acres__c = 1000);
    	insert area;
        
        //application
        Application__c app1 = new Application__c(Name='test app', Area__c = Area.id, Date__c = myDate);
        Application__c app2 = new Application__c(Name='test app 2', Area__c = Area.id, Date__c = myDate);
		insert app1;
        insert app2;
        //app products
        //insert app product
    	App_Product__c ap1 = new App_Product__c(Application__c = app1.Id, Product__c= r1.id, Oz_M__c =1,
                                                Unit_Price__c = 100, Unit_Cost__c = 23, Units_Required__c = 1,Margin__c = 23 );
    	App_Product__c ap2 = new App_Product__c(Application__c = app1.Id, Product__c= r2.id, Oz_M__c =1,
                                                Unit_Price__c = 100, Unit_Cost__c = 23, Units_Required__c = 1,Margin__c = 23 );    
        insert ap1;
        insert ap2;
        
        //insert app product
    	App_Product__c ap3 = new App_Product__c(Application__c = app2.Id, Product__c= r1.id, Oz_M__c =1,
                                                Unit_Price__c = 100, Unit_Cost__c = 23, Units_Required__c = 1,Margin__c = 23 );
    	App_Product__c ap4 = new App_Product__c(Application__c = app2.Id, Product__c= r2.id, Oz_M__c =1,
                                                Unit_Price__c = 100, Unit_Cost__c = 23, Units_Required__c = 1,Margin__c = 23 );    
        insert ap3;
        insert ap4;
        
        //new date
        Date newDate = Date.newInstance(2045, 1, 4);
        list<string> pricebookIds = new list<string>();
        pricebookIds.add(pricebookId);
        pricebookIds.add(pb2.id);
        pricebookIds.add(pb3.id);
        test.startTest();
        	cpqProgramClone.returnWrapper x = cpqProgramClone.cpqProgramCloneStep1(Program.Id, true, '');
        	string backApps = JSON.serialize(x.backApps); 
        	string y = cpqProgramClone.cloneProductsWithPriceBooks(backApps, pricebookIds);
        test.stopTest();
    }
}