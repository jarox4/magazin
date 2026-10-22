package main

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Product struct {
	ID int `json:"id"`
	InventoryNumber string `json:"inventory_number"`
	CategoryID int `json:"category_id"`
	CategoryName string `json:"category_name"`
	Name string  `json:"name"`
	ManufacturerID int `json:"manufacturer_id"`
	ManufacturerName string `json:"manufacturer_name"`
	Price float64 `json:"price"`
	Quantity int `json:"quantity"`
	ImageURL *string `json:"image_url"`
	Description *string `json:"description"`
}

// listProducts godoc
// @Summary     List products (public catalog)
// @Tags        products
// @Produce     json
// @Param       category query int    false "Filter by category ID"
// @Param       search   query string false "Search by name"
// @Success     200 {array}  Product
// @Router      /products [get]
func listProducts(c *gin.Context) {
	query := `
		SELECT i.id, i.inventory_number, i.category_id, pc.name,
		       i.name, i.manufacturer_id, m.name, i.price, i.quantity,
		       i.image_url, i.description
		FROM inventory i
		JOIN product_categories pc ON i.category_id = pc.id
		JOIN manufacturers m ON i.manufacturer_id = m.id
		WHERE i.quantity > 0`

	args := []any{}
	n := 1
	if cat := c.Query("category"); cat != "" {
		query += ` AND i.category_id = $` + strconv.Itoa(n)
		args = append(args, cat); n++
	}
	if s := c.Query("search"); s != "" {
		query += ` AND i.name ILIKE $` + strconv.Itoa(n)
		args = append(args, "%"+s+"%"); n++
	}
	query += ` ORDER BY i.name`

	rows, err := db.Query(context.Background(), query, args...)
	if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		rows.Scan(&p.ID, &p.InventoryNumber, &p.CategoryID, &p.CategoryName,
			&p.Name, &p.ManufacturerID, &p.ManufacturerName, &p.Price, &p.Quantity,
			&p.ImageURL, &p.Description)
		products = append(products, p)
	}
	if products == nil { products = []Product{} }
	c.JSON(http.StatusOK, products)
}

// getProduct godoc
// @Summary     Get single product
// @Tags        products
// @Produce     json
// @Param       id path int true "Product ID"
// @Success     200 {object} Product
// @Failure     404 {object} ErrorResponse
// @Router      /products/{id} [get]
func getProduct(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var p Product
	err := db.QueryRow(context.Background(), `
		SELECT i.id, i.inventory_number, i.category_id, pc.name,
		       i.name, i.manufacturer_id, m.name, i.price, i.quantity,
		       i.image_url, i.description
		FROM inventory i
		JOIN product_categories pc ON i.category_id = pc.id
		JOIN manufacturers m ON i.manufacturer_id = m.id
		WHERE i.id = $1`, id,
	).Scan(&p.ID, &p.InventoryNumber, &p.CategoryID, &p.CategoryName,
		&p.Name, &p.ManufacturerID, &p.ManufacturerName, &p.Price, &p.Quantity,
		&p.ImageURL, &p.Description)
	if err != nil { c.JSON(http.StatusNotFound, ErrorResponse{Error: "не найден"}); return }
	c.JSON(http.StatusOK, p)
}
