package main

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Category represents a product category
type Category struct {
	ID   int    `json:"id" example:"1"`
	Name string `json:"name" example:"Electronics"`
}

// Manufacturer represents a product manufacturer
type Manufacturer struct {
	ID   int    `json:"id" example:"1"`
	Name string `json:"name" example:"Acme Corp"`
}

// listCategories godoc
// @Summary     List product categories
// @Tags        lookup
// @Produce     json
// @Success     200 {array}  Category
// @Failure     500 {object} ErrorResponse
// @Router      /categories [get]
func listCategories(c *gin.Context) {
	rows, err := db.Query(context.Background(), `SELECT id, name FROM product_categories ORDER BY name`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	defer rows.Close()
	var cats []Category
	for rows.Next() {
		var cat Category
		rows.Scan(&cat.ID, &cat.Name)
		cats = append(cats, cat)
	}
	if cats == nil {
		cats = []Category{}
	}
	c.JSON(http.StatusOK, cats)
}

// listManufacturers godoc
// @Summary     List manufacturers
// @Tags        lookup
// @Produce     json
// @Success     200 {array}  Manufacturer
// @Failure     500 {object} ErrorResponse
// @Router      /manufacturers [get]
func listManufacturers(c *gin.Context) {
	rows, err := db.Query(context.Background(), `SELECT id, name FROM manufacturers ORDER BY name`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	defer rows.Close()
	var mfrs []Manufacturer
	for rows.Next() {
		var m Manufacturer
		rows.Scan(&m.ID, &m.Name)
		mfrs = append(mfrs, m)
	}
	if mfrs == nil {
		mfrs = []Manufacturer{}
	}
	c.JSON(http.StatusOK, mfrs)
}
