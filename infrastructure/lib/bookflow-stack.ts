import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

interface BookFlowStackProps extends cdk.StackProps {
  stage: 'dev' | 'staging' | 'prod';
}

export class BookFlowStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: BookFlowStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // 🗄️ DynamoDB Tables
    const organizationsTable = new dynamodb.Table(this, 'OrganizationsTable', {
      tableName: `bookflow-organizations-${stage}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: stage === 'prod'
      },
    });

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `bookflow-users-${stage}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: stage === 'prod'
      },
    });

    // GSI para buscar usuarios por Cognito ID
    usersTable.addGlobalSecondaryIndex({
      indexName: 'cognitoId-index',
      partitionKey: { name: 'cognitoId', type: dynamodb.AttributeType.STRING },
    });

    const appointmentsTable = new dynamodb.Table(this, 'AppointmentsTable', {
      tableName: `bookflow-appointments-${stage}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: stage === 'prod'
      },
    });

    // 💳 Subscriptions Table for Stripe integration
    const subscriptionsTable = new dynamodb.Table(this, 'SubscriptionsTable', {
      tableName: `bookflow-subscriptions-${stage}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: stage === 'prod'
      },
    });

    // GSI para buscar suscripciones por Organization ID
    subscriptionsTable.addGlobalSecondaryIndex({
      indexName: 'OrganizationIdIndex',
      partitionKey: { name: 'organizationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // GSI para buscar suscripciones por Transbank Order ID
    subscriptionsTable.addGlobalSecondaryIndex({
      indexName: 'TransbankOrderIdIndex',
      partitionKey: { name: 'transbankOrderId', type: dynamodb.AttributeType.STRING },
    });

    // GSI para buscar suscripciones por status
    subscriptionsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'current_period_end', type: dynamodb.AttributeType.NUMBER },
    });

    // 🔐 Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `bookflow-users-${stage}`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      customAttributes: {
        orgId: new cognito.StringAttribute({ minLen: 1, maxLen: 50, mutable: true }),
        role: new cognito.StringAttribute({ minLen: 1, maxLen: 20, mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // User Pool Client
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `bookflow-client-${stage}`,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: stage === 'prod' 
          ? ['https://bookflow.com/auth/callback']
          : ['http://localhost:3000/auth/callback'],
      },
    });

    // Identity Pool
    this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: `bookflow_identity_${stage}`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: this.userPoolClient.userPoolClientId,
        providerName: this.userPool.userPoolProviderName,
      }],
    });

    // 📦 S3 Bucket for Frontend (CORREGIDO)
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `bookflow-frontend-${stage}-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      publicReadAccess: true,
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
    });

    // 🔧 Lambda Environment Variables
    const lambdaEnvironment = {
      STAGE: stage,
      USER_POOL_ID: this.userPool.userPoolId,
      USER_POOL_CLIENT_ID: this.userPoolClient.userPoolClientId,
      ORGANIZATIONS_TABLE: organizationsTable.tableName,
      USERS_TABLE: usersTable.tableName,
      APPOINTMENTS_TABLE: appointmentsTable.tableName,
      SUBSCRIPTIONS_TABLE: subscriptionsTable.tableName,
      REGION: this.region,
      // Transbank environment variables (these should be set in your deployment environment)
      TRANSBANK_COMMERCE_CODE: process.env.TRANSBANK_COMMERCE_CODE || '597055555532',
      TRANSBANK_API_KEY: process.env.TRANSBANK_API_KEY || '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
      TRANSBANK_ENVIRONMENT: process.env.TRANSBANK_ENVIRONMENT || 'integration',
    };

    // 🔧 Lambda Execution Role
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [
                organizationsTable.tableArn,
                usersTable.tableArn,
                appointmentsTable.tableArn,
                subscriptionsTable.tableArn,
                `${usersTable.tableArn}/index/*`,
                `${subscriptionsTable.tableArn}/index/*`,
              ],
            }),
          ],
        }),
        CognitoAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cognito-idp:AdminCreateUser',
                'cognito-idp:AdminSetUserPassword',
                'cognito-idp:AdminUpdateUserAttributes',
                'cognito-idp:AdminGetUser',
                'cognito-idp:ListUsers',
              ],
              resources: [this.userPool.userPoolArn],
            }),
          ],
        }),
      },
    });

    // Actualizar la función authFunction para no usar custom attributes por ahora:
    const authFunction = new lambda.Function(this, 'AuthFunction', {
      functionName: `bookflow-auth-${stage}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      environment: lambdaEnvironment,
      role: lambdaExecutionRole,
      code: lambda.Code.fromInline(`
        const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
        
        const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });
        const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
        
        const USER_POOL_ID = process.env.USER_POOL_ID;
        const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID;
        const USERS_TABLE = process.env.USERS_TABLE;
        const ORGANIZATIONS_TABLE = process.env.ORGANIZATIONS_TABLE;
        
        const generateUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };
        
        const createResponse = (statusCode, body) => ({
          statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
          body: JSON.stringify(body),
        });
        
        const createOrganization = async (name, templateType) => {
          const orgId = generateUUID();
          const now = new Date().toISOString();
          
          const organization = {
            PK: \`ORG#\${orgId}\`,
            SK: 'PROFILE',
            id: orgId,
            name: name,
            templateType: templateType,
            settings: {
              timezone: 'America/Santiago',
              businessHours: {
                monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                saturday: { isOpen: true, openTime: '09:00', closeTime: '15:00' },
                sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
              },
              notifications: {
                emailReminders: true,
                smsReminders: false,
                autoConfirmation: true,
                reminderHours: 24,
              },
            },
            subscription: {
              plan: 'free',
              limits: {
                maxResources: templateType === 'beauty_salon' ? 2 : 1,
                maxAppointmentsPerMonth: 100,
                maxUsers: 3,
              },
            },
            createdAt: now,
            updatedAt: now,
          };
          
          const command = new PutCommand({
            TableName: ORGANIZATIONS_TABLE,
            Item: organization,
          });
          
          await dynamoClient.send(command);
          return { id: orgId, name: name, templateType: templateType };
        };
        
        const createUser = async (cognitoId, email, firstName, lastName, orgId) => {
          const userId = generateUUID();
          const now = new Date().toISOString();
          
          const user = {
            PK: \`USER#\${userId}\`,
            SK: 'PROFILE',
            id: userId,
            cognitoId: cognitoId,
            email: email,
            role: 'owner',
            orgId: orgId,
            profile: { firstName: firstName, lastName: lastName },
            createdAt: now,
            updatedAt: now,
          };
          
          const command = new PutCommand({
            TableName: USERS_TABLE,
            Item: user,
          });
          
          await dynamoClient.send(command);
          return {
            id: userId,
            email: email,
            role: 'owner',
            orgId: orgId,
            profile: { firstName: firstName, lastName: lastName },
            cognitoId: cognitoId,
          };
        };
        
        const getUserByCognitoId = async (cognitoId) => {
          const command = new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: 'cognitoId-index',
            KeyConditionExpression: 'cognitoId = :cognitoId',
            ExpressionAttributeValues: { ':cognitoId': cognitoId },
          });
          
          const result = await dynamoClient.send(command);
          if (result.Items && result.Items.length > 0) {
            const item = result.Items[0];
            const { PK, SK, ...user } = item;
            return user;
          }
          return null;
        };
        
        exports.handler = async (event) => {
          console.log('=== REAL AUTH FUNCTION (NO CUSTOM ATTRS) ===');
          console.log('Event:', JSON.stringify(event, null, 2));
          
          try {
            const { httpMethod, path, body } = event;
            let requestBody = {};
            
            if (body) {
              try {
                requestBody = JSON.parse(body);
                console.log('Parsed body:', requestBody);
              } catch (e) {
                console.log('Error parsing body:', e);
                return createResponse(400, { success: false, error: 'Invalid JSON in request body' });
              }
            }
            
            // Handle CORS preflight
            if (httpMethod === 'OPTIONS') {
              return {
                statusCode: 200,
                headers: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                body: '',
              };
            }
            
            // REGISTER ENDPOINT (SIN CUSTOM ATTRIBUTES)
            if (path && path.endsWith('/auth/register') && httpMethod === 'POST') {
              console.log('=== REGISTRATION START (NO CUSTOM ATTRS) ===');
              const { email, password, firstName, lastName, organizationName, templateType } = requestBody;
              
              // Validation
              if (!email || !password || !firstName || !lastName || !organizationName || !templateType) {
                return createResponse(400, { success: false, error: 'Todos los campos son requeridos' });
              }
              
              if (password.length < 8) {
                return createResponse(400, { success: false, error: 'La contraseña debe tener al menos 8 caracteres' });
              }
              
              // Step 1: Create organization
              console.log('Creating organization...');
              const organization = await createOrganization(organizationName, templateType);
              console.log('Organization created:', organization);
              
              // Step 2: Create user in Cognito (SIN custom attributes)
              console.log('Creating user in Cognito...');
              const tempPassword = password + 'Temp1!';
              
              const createUserCommand = new AdminCreateUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: email,
                UserAttributes: [
                  { Name: 'email', Value: email },
                  { Name: 'email_verified', Value: 'true' },
                  { Name: 'given_name', Value: firstName },
                  { Name: 'family_name', Value: lastName },
                  // NO agregamos custom attributes por ahora
                ],
                MessageAction: 'SUPPRESS',
                TemporaryPassword: tempPassword,
              });
              
              const cognitoUser = await cognitoClient.send(createUserCommand);
              const cognitoId = cognitoUser.User.Username;
              console.log('Cognito user created:', cognitoId);
              
              // Step 3: Set permanent password
              console.log('Setting permanent password...');
              const setPasswordCommand = new AdminSetUserPasswordCommand({
                UserPoolId: USER_POOL_ID,
                Username: email,
                Password: password,
                Permanent: true,
              });
              
              await cognitoClient.send(setPasswordCommand);
              console.log('Password set successfully');
              
              // Step 4: Create user in DynamoDB
              console.log('Creating user in DynamoDB...');
              const user = await createUser(cognitoId, email, firstName, lastName, organization.id);
              console.log('User created in DynamoDB:', user);
              
              // Step 5: Auto-login
              console.log('Auto-login...');
              const loginCommand = new InitiateAuthCommand({
                ClientId: USER_POOL_CLIENT_ID,
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: { USERNAME: email, PASSWORD: password },
              });
              
              const authResult = await cognitoClient.send(loginCommand);
              console.log('Auto-login successful');
              
              return createResponse(200, {
                success: true,
                message: 'Usuario registrado exitosamente',
                user: user,
                organization: organization,
                tokens: {
                  accessToken: authResult.AuthenticationResult.AccessToken,
                  idToken: authResult.AuthenticationResult.IdToken,
                  refreshToken: authResult.AuthenticationResult.RefreshToken,
                },
              });
            }
            
            // LOGIN ENDPOINT
            if (path && path.endsWith('/auth/login') && httpMethod === 'POST') {
              console.log('=== LOGIN START ===');
              const { email, password } = requestBody;
              
              if (!email || !password) {
                return createResponse(400, { success: false, error: 'Email y contraseña son requeridos' });
              }
              
              // Authenticate with Cognito
              console.log('Authenticating with Cognito...');
              const loginCommand = new InitiateAuthCommand({
                ClientId: USER_POOL_CLIENT_ID,
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: { USERNAME: email, PASSWORD: password },
              });
              
              const authResult = await cognitoClient.send(loginCommand);
              
              if (authResult.ChallengeName) {
                return createResponse(400, { success: false, error: 'Autenticación requiere pasos adicionales' });
              }
              
              // Get user info from token
              const accessToken = authResult.AuthenticationResult.AccessToken;
              const tokenPayload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
              const cognitoUsername = tokenPayload.username;
              console.log('Token decoded, Cognito username:', cognitoUsername);
              
              // Get user from DynamoDB
              console.log('Getting user from DynamoDB...');
              const user = await getUserByCognitoId(cognitoUsername);
              
              if (!user) {
                return createResponse(404, { success: false, error: 'Usuario no encontrado en el sistema' });
              }
              
              console.log('Login successful for user:', user.email);
              
              return createResponse(200, {
                success: true,
                message: 'Login exitoso',
                user: user,
                tokens: {
                  accessToken: authResult.AuthenticationResult.AccessToken,
                  idToken: authResult.AuthenticationResult.IdToken,
                  refreshToken: authResult.AuthenticationResult.RefreshToken,
                },
                expiresIn: authResult.AuthenticationResult.ExpiresIn,
              });
            }
            
            // GET CURRENT USER ENDPOINT
            if (path && path.endsWith('/auth/me') && httpMethod === 'GET') {
              console.log('=== GET CURRENT USER START ===');
              
              // Get authorization header
              const authHeader = event.headers.Authorization || event.headers.authorization;
              if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return createResponse(401, { success: false, error: 'Token de acceso requerido' });
              }
              
              const accessToken = authHeader.substring(7);
              
              try {
                // Get user info from token
                const tokenPayload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
                const cognitoUsername = tokenPayload.username;
                console.log('Token decoded, Cognito username:', cognitoUsername);
                
                // Get user from DynamoDB
                console.log('Getting user from DynamoDB...');
                const user = await getUserByCognitoId(cognitoUsername);
                
                if (!user) {
                  return createResponse(404, { success: false, error: 'Usuario no encontrado en el sistema' });
                }
                
                // Get organization if user has orgId
                let organization = null;
                if (user.orgId) {
                  const orgCommand = new GetCommand({
                    TableName: ORGANIZATIONS_TABLE,
                    Key: { PK: \`ORG#\${user.orgId}\`, SK: 'PROFILE' },
                  });
                  
                  const orgResult = await dynamoClient.send(orgCommand);
                  if (orgResult.Item) {
                    const { PK, SK, ...org } = orgResult.Item;
                    organization = {
                      id: org.id,
                      name: org.name,
                      templateType: org.templateType,
                    };
                  }
                }
                
                console.log('Current user retrieved successfully:', user.email);
                
                return createResponse(200, {
                  success: true,
                  message: 'Usuario actual obtenido exitosamente',
                  user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    orgId: user.orgId,
                    profile: user.profile,
                    cognitoId: user.cognitoId,
                  },
                  organization: organization,
                });
              } catch (tokenError) {
                console.error('Error decoding token:', tokenError);
                return createResponse(401, { success: false, error: 'Token inválido' });
              }
            }
            
            return createResponse(404, { success: false, error: 'Endpoint no encontrado' });
            
          } catch (error) {
            console.error('=== AUTH ERROR ===');
            console.error('Error:', error);
            console.error('Stack:', error.stack);
            
            if (error.name === 'UsernameExistsException') {
              return createResponse(400, { success: false, error: 'Ya existe un usuario con este email' });
            }
            
            if (error.name === 'InvalidPasswordException') {
              return createResponse(400, { success: false, error: 'La contraseña no cumple con los requisitos de seguridad' });
            }
            
            if (error.name === 'NotAuthorizedException') {
              return createResponse(400, { success: false, error: 'Email o contraseña incorrectos' });
            }
            
            return createResponse(500, { success: false, error: 'Error interno del servidor: ' + error.message });
          }
        };
      `),
    });

    // 💳 Transbank Function
    const transbankFunction = new lambdaNodejs.NodejsFunction(this, 'TransbankFunction', {
      functionName: `bookflow-transbank-${stage}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/functions/transbank.ts'),
      timeout: cdk.Duration.seconds(30),
      environment: lambdaEnvironment,
      role: lambdaExecutionRole,
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        target: 'es2020',
      },
    });

    const organizationsFunction = new lambda.Function(this, 'OrganizationsFunction', {
      functionName: `bookflow-organizations-${stage}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      environment: lambdaEnvironment,
      role: lambdaExecutionRole,
      code: lambda.Code.fromInline(`
        const { CognitoIdentityProviderClient, GetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
        
        const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });
        const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
        
        const ORGANIZATIONS_TABLE = process.env.ORGANIZATIONS_TABLE;
        const USERS_TABLE = process.env.USERS_TABLE;
        
        const createResponse = (statusCode, body) => ({
          statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
          body: JSON.stringify(body),
        });
        
        const getCurrentUser = async (accessToken) => {
          try {
            const command = new GetUserCommand({ AccessToken: accessToken });
            const cognitoUser = await cognitoClient.send(command);
            
            const cognitoId = cognitoUser.Username;
            
            const userQuery = new QueryCommand({
              TableName: USERS_TABLE,
              IndexName: 'cognitoId-index',
              KeyConditionExpression: 'cognitoId = :cognitoId',
              ExpressionAttributeValues: { ':cognitoId': cognitoId },
            });
            
            const userResult = await dynamoClient.send(userQuery);
            
            if (!userResult.Items || userResult.Items.length === 0) {
              throw new Error('Usuario no encontrado');
            }
            
            const { PK, SK, ...user } = userResult.Items[0];
            return user;
          } catch (error) {
            throw new Error('Token inválido o usuario no encontrado');
          }
        };
        
        const getOrganization = async (orgId) => {
          const command = new GetCommand({
            TableName: ORGANIZATIONS_TABLE,
            Key: { PK: \`ORG#\${orgId}\`, SK: 'PROFILE' },
          });
          
          const result = await dynamoClient.send(command);
          if (!result.Item) return null;
          
          const { PK, SK, ...organization } = result.Item;
          return organization;
        };
        
        const updateOrganization = async (orgId, updates) => {
          const updatedData = {
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          const item = {
            PK: \`ORG#\${orgId}\`,
            SK: 'PROFILE',
            ...updatedData,
          };

          const command = new PutCommand({
            TableName: ORGANIZATIONS_TABLE,
            Item: item,
          });

          await dynamoClient.send(command);
          
          const { PK, SK, ...organization } = item;
          return organization;
        };
        
        exports.handler = async (event) => {
          console.log('=== ORGANIZATIONS HANDLER ===');
          console.log('Event:', JSON.stringify(event, null, 2));
          
          try {
            const { httpMethod, path, body, headers, pathParameters } = event;
            
            // Handle CORS preflight
            if (httpMethod === 'OPTIONS') {
              return createResponse(200, {});
            }
            
            // Parse request body if present
            let requestData = {};
            if (body) {
              try {
                requestData = JSON.parse(body);
              } catch (error) {
                return createResponse(400, { success: false, error: 'Invalid JSON in request body' });
              }
            }
            
            // Extract user from token for protected endpoints
            const authHeader = headers.Authorization || headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return createResponse(401, { success: false, error: 'Token de acceso requerido' });
            }
            
            const accessToken = authHeader.substring(7);
            let currentUser;
            
            try {
              currentUser = await getCurrentUser(accessToken);
            } catch (error) {
              return createResponse(401, { success: false, error: error.message });
            }
            
            // GET USER'S ORGANIZATION
            if (path?.endsWith('/organizations/me') && httpMethod === 'GET') {
              console.log('=== GET MY ORGANIZATION REQUEST ===');
              
              if (!currentUser.orgId) {
                return createResponse(404, { success: false, error: 'El usuario no pertenece a ninguna organización' });
              }
              
              if (currentUser.orgId !== currentUser.orgId) {
                return createResponse(403, { success: false, error: 'No tienes permisos para acceder a esta organización' });
              }
              
              const organization = await getOrganization(currentUser.orgId);
              if (!organization) {
                return createResponse(404, { success: false, error: 'Organización no encontrada' });
              }
              
              return createResponse(200, {
                success: true,
                organization: {
                  id: organization.id,
                  name: organization.name,
                  templateType: organization.templateType,
                  settings: organization.settings,
                  subscription: organization.subscription,
                  createdAt: organization.createdAt,
                  updatedAt: organization.updatedAt,
                },
                message: 'Organización del usuario obtenida exitosamente'
              });
            }
            
            // UPDATE ORGANIZATION SETTINGS
            if (path?.match(/\\/organizations\\/[^/]+\\/settings$/) && httpMethod === 'PUT') {
              console.log('=== UPDATE ORGANIZATION SETTINGS REQUEST ===');
              
              const orgId = pathParameters?.orgId;
              if (!orgId) {
                return createResponse(400, { success: false, error: 'ID de organización requerido' });
              }
              
              if (currentUser.role !== 'owner') {
                return createResponse(403, { success: false, error: 'Solo los propietarios pueden modificar las configuraciones de la organización' });
              }
              
              if (currentUser.orgId !== orgId) {
                return createResponse(403, { success: false, error: 'No tienes permisos para modificar esta organización' });
              }
              
              const currentOrg = await getOrganization(orgId);
              if (!currentOrg) {
                return createResponse(404, { success: false, error: 'Organización no encontrada' });
              }
              
              const organizationToUpdate = {
                ...currentOrg,
                settings: {
                  ...currentOrg.settings,
                  ...(requestData.timezone && { timezone: requestData.timezone }),
                  ...(requestData.businessHours && { 
                    businessHours: {
                      ...currentOrg.settings.businessHours,
                      ...requestData.businessHours,
                    }
                  }),
                  ...(requestData.notifications && { 
                    notifications: {
                      ...currentOrg.settings.notifications,
                      ...requestData.notifications,
                    }
                  }),
                }
              };
              
              const updatedOrganization = await updateOrganization(orgId, organizationToUpdate);
              
              return createResponse(200, {
                success: true,
                organization: {
                  id: updatedOrganization.id,
                  name: updatedOrganization.name,
                  templateType: updatedOrganization.templateType,
                  settings: updatedOrganization.settings,
                  subscription: updatedOrganization.subscription,
                  updatedAt: updatedOrganization.updatedAt,
                },
                message: 'Configuraciones de la organización actualizadas exitosamente'
              });
            }
            
            return createResponse(404, { success: false, error: 'Endpoint no encontrado' });
            
          } catch (error) {
            console.error('=== ORGANIZATIONS HANDLER ERROR ===');
            console.error('Error:', error);
            
            return createResponse(500, { success: false, error: 'Error interno del servidor: ' + error.message });
          }
        };
      `),
    });

    // 🌐 API Gateway
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `bookflow-api-${stage}`,
      description: `BookFlow API for ${stage}`,
      deployOptions: {
        stageName: stage,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: stage === 'prod' 
          ? ['https://bookflow.com']
          : ['http://localhost:3000', 'http://localhost:5173'],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // API Routes
    const v1 = this.api.root.addResource('v1');

    // Auth routes with CORS
    const auth = v1.addResource('auth', {
      defaultCorsPreflightOptions: {
        allowOrigins: stage === 'prod' 
          ? ['https://bookflow.com']
          : ['http://localhost:3000', 'http://localhost:5173'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });
    
    auth.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(authFunction));
    auth.addResource('register').addMethod('POST', new apigateway.LambdaIntegration(authFunction));
    auth.addResource('forgot-password').addMethod('POST', new apigateway.LambdaIntegration(authFunction));
    auth.addResource('reset-password').addMethod('POST', new apigateway.LambdaIntegration(authFunction));
    auth.addResource('refresh').addMethod('POST', new apigateway.LambdaIntegration(authFunction));
    auth.addResource('me').addMethod('GET', new apigateway.LambdaIntegration(authFunction));

    // Organizations routes with CORS
    const organizations = v1.addResource('organizations', {
      defaultCorsPreflightOptions: {
        allowOrigins: stage === 'prod' 
          ? ['https://bookflow.com']
          : ['http://localhost:3000', 'http://localhost:5173'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });
    
    organizations.addMethod('GET', new apigateway.LambdaIntegration(organizationsFunction));
    organizations.addMethod('POST', new apigateway.LambdaIntegration(organizationsFunction));
    
    // User's organization route
    const organizationsMe = organizations.addResource('me');
    organizationsMe.addMethod('GET', new apigateway.LambdaIntegration(organizationsFunction));
    
    const organizationById = organizations.addResource('{orgId}');
    organizationById.addMethod('GET', new apigateway.LambdaIntegration(organizationsFunction));
    organizationById.addMethod('PUT', new apigateway.LambdaIntegration(organizationsFunction));
    
    // Organization settings route
    const organizationSettings = organizationById.addResource('settings');
    organizationSettings.addMethod('PUT', new apigateway.LambdaIntegration(organizationsFunction));

    // 💳 Transbank routes with CORS
    const transbank = v1.addResource('transbank', {
      defaultCorsPreflightOptions: {
        allowOrigins: stage === 'prod' 
          ? ['https://bookflow.com']
          : ['http://localhost:3000', 'http://localhost:5173'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Transbank transaction endpoints
    const createTransaction = transbank.addResource('create-transaction');
    createTransaction.addMethod('POST', new apigateway.LambdaIntegration(transbankFunction));

    // Transbank transaction confirmation
    const confirmTransaction = transbank.addResource('confirm-transaction');
    confirmTransaction.addMethod('POST', new apigateway.LambdaIntegration(transbankFunction));

    // Transbank payment verification
    const verifyPayment = transbank.addResource('verify-payment');
    const verifyPaymentToken = verifyPayment.addResource('{token}');
    verifyPaymentToken.addMethod('GET', new apigateway.LambdaIntegration(transbankFunction));

    // Transbank subscription management
    const subscription = transbank.addResource('subscription');
    const subscriptionOrgId = subscription.addResource('{organizationId}');
    subscriptionOrgId.addMethod('GET', new apigateway.LambdaIntegration(transbankFunction));

    // Transbank subscription cancellation
    const cancelSubscription = transbank.addResource('cancel-subscription');
    cancelSubscription.addMethod('POST', new apigateway.LambdaIntegration(transbankFunction));

    // Transbank free trial
    const startFreeTrial = transbank.addResource('start-free-trial');
    startFreeTrial.addMethod('POST', new apigateway.LambdaIntegration(transbankFunction));

    // Transbank monthly billing
    const generateBilling = transbank.addResource('generate-billing');
    generateBilling.addMethod('POST', new apigateway.LambdaIntegration(transbankFunction));

    // Transbank payment confirmation webhook
    const paymentConfirmation = transbank.addResource('payment-confirmation');
    paymentConfirmation.addMethod('POST', new apigateway.LambdaIntegration(transbankFunction));

    // 📤 Stack Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `BookFlow-${stage}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `BookFlow-${stage}-UserPoolClientId`,
    });

    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPool.ref,
      description: 'Cognito Identity Pool ID',
      exportName: `BookFlow-${stage}-IdentityPoolId`,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
      exportName: `BookFlow-${stage}-ApiUrl`,
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 Frontend Bucket Name',
      exportName: `BookFlow-${stage}-FrontendBucketName`,
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: frontendBucket.bucketWebsiteUrl,
      description: 'Frontend Website URL',
      exportName: `BookFlow-${stage}-WebsiteUrl`,
    });

    // Región para reference
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: `BookFlow-${stage}-Region`,
    });
  }
}