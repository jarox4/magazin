// @title        StockStore API
// @version      3.0
// @description  Shop API with auth, inventory, orders
// @host         localhost:8080
// @BasePath     /api
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
package main

import (
	"context"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "stockstore/docs"
)


type ErrorResponse   struct { Error   string `json:"error"`   }
type IDResponse      struct { ID      int    `json:"id"`      }
type UpdatedResponse struct { Updated bool   `json:"updated"` }
type DeletedResponse struct { Deleted bool   `json:"deleted"` }

var db *pgxpool.Pool
func main() {
	_ = godotenv.Load()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable"
	}

	var err error
	db, err = pgxpool.New(context.Background(), dsn)
	if err != nil { log.Fatalf("DB connect: %v", err) }
	defer db.Close()
	if err = db.Ping(context.Background()); err != nil { log.Fatalf("DB ping: %v", err) }
	log.Println("DB connected")

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET","POST","PUT","DELETE","OPTIONS"},
		AllowHeaders:     []string{"Origin","Content-Type","Authorization"},
		AllowCredentials: true,
	}))

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := r.Group("/api")
	{
		api.POST("/auth/register", register)
		api.POST("/auth/login", login)
		api.GET("/products", listProducts)
		api.GET("/products/:id", getProduct)
		api.GET("/categories", listCategories)
		api.GET("/manufacturers", listManufacturers)

		auth := api.Group("/", authMiddleware("customer","admin"))
		{
			auth.GET("/orders", listMyOrders)
			auth.POST("/orders", createOrder)
			auth.GET("/orders/:id", getOrder)
			auth.DELETE("/orders/:id",cancelOrder)
			auth.GET("/me", getMe)
			auth.PUT("/me", updateMe)
		}

		admin := api.Group("/admin", authMiddleware("admin"))
		{
			admin.GET("/inventory", listInventory)
			admin.GET("/inventory/:id", getInventoryItem)
			admin.POST("/inventory", createInventoryItem)
			admin.PUT("/inventory/:id", updateInventoryItem)
			admin.DELETE("/inventory/:id",deleteInventoryItem)
			admin.GET("/orders", adminListOrders)
			admin.PUT("/orders/:id", adminUpdateOrder)
			admin.GET("/customers", listCustomers)
		}
	}

	port := os.Getenv("PORT")
	if port == "" { port = "8080" }
	log.Printf("Running :%s  Swagger: http://localhost:%s/swagger/index.html", port, port)
	r.Run(":" + port)
}
