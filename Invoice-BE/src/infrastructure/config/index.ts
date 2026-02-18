export default () => ({
    env: process.env.NODE_ENV,
    port: parseInt(process.env.PORT, 10) || 3001,
    frontURL: process.env.FRONT_END_URL,
    baseURL: process.env.BASE_URL,
    jwt: {
        access: {
            secret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN,
        },
        refresh: {
            secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_EXPIRES_IN,
        },
        reset: {
            secret: process.env.JWT_RESET_SECRET || process.env.JWT_SECRET,
            expiresIn: process.env.JWT_RESET_EXPIRES_IN || process.env.JWT_EXPIRES_IN,
        }
    },
    database: {
        mongoConnectionString: process.env.MONGO_CONNECTION_STRING,
        mongoUser: process.env.MONGO_USER,
        mongoPassword: process.env.MONGO_PASSWORD,
        mongoProtocol: process.env.MONGO_PROTOCOL,
        mongoHost: process.env.MONGO_HOST,
        mongoPort: process.env.MONGO_PORT,
        mongoDb: process.env.MONGO_DB,
    },
    mailer: {
        host: process.env.MAILER_HOST,
        port: parseInt(process.env.MAILER_PORT),
        user: process.env.MAILER_USER,
        password: process.env.MAILER_PASSWORD,
        sender: process.env.MAILER_SENDER,
        sendgridApiKey: process.env.SENDGRID_API_KEY,
    },
     spaceObject: {
         endpoint: process.env.SPACE_ENDPOINT,
         region: process.env.SPACE_REGION,
         public_endpoint : process.env.SPACE_PUBLIC_ENDPOINT ,
         accessKeyId: process.env.SPACE_ACCESS_KEY,
         secretKey: process.env.SPACE_SECRET_KEY,
         bucket: process.env.SPACE_BUCKET
 },

});
