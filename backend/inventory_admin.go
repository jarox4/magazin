package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type InventoryItem struct {
	ID               int       `json:"id"`
	InventoryNumber  string    `json:"inventory_number"`
	CategoryID       int       `json:"category_id"`
	CategoryName     string    `json:"category_name"`
	Name             string    `json:"name"`
	DateReceived     time.Time    `json:"date_received"`
	ShelfLifeDays    *int      `json:"shelf_life_days"`
	ExpiryDate       *string   `json:"expiry_date"`
	ManufacturerID   int       `json:"manufacturer_id"`
	ManufacturerName string    `json:"manufacturer_name"`
	Price            float64   `json:"price"`
	Quantity         int       `json:"quantity"`
	ImageURL         *string   `json:"image_url"`
	Description      *string   `json:"description"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type InventoryInput struct {
	InventoryNumber string   `json:"inventory_number" binding:"required"`
	CategoryID      int      `json:"category_id"      binding:"required"`
	Name            string   `json:"name"             binding:"required"`
	DateReceived    string   `json:"date_received"    binding:"required"`
	ShelfLifeDays   *int     `json:"shelf_life_days"`
	ExpiryDate      *string  `json:"expiry_date"`
	ManufacturerID  int      `json:"manufacturer_id"  binding:"required"`
	Price           float64  `json:"price"            binding:"required,min=0"`
	Quantity        int      `json:"quantity"         binding:"min=0"`
	ImageURL        *string  `json:"image_url"`
	Description     *string  `json:"description"`
}

const inventorySelectSQL = `
	SELECT i.id, i.inventory_number, i.category_id, pc.name,
	       i.name, i.date_received, i.shelf_life_days, i.expiry_date,
	       i.manufacturer_id, m.name, i.price, i.quantity,
	       i.image_url, i.description, i.created_at, i.updated_at
	FROM inventory i
	JOIN product_categories pc ON i.category_id = pc.id
	JOIN manufacturers m ON i.manufacturer_id = m.id`

func scanInventoryRow(row interface{ Scan(...any) error }) (InventoryItem, error) {
	var item InventoryItem
	err := row.Scan(
		&item.ID, &item.InventoryNumber, &item.CategoryID, &item.CategoryName,
		&item.Name, &item.DateReceived, &item.ShelfLifeDays, &item.ExpiryDate,
		&item.ManufacturerID, &item.ManufacturerName, &item.Price, &item.Quantity,
		&item.ImageURL, &item.Description, &item.CreatedAt, &item.UpdatedAt,
	)
	fmt.Println(err)
	return item, err
}

// listInventory godoc
// @Summary     [Admin]List inventory items
// @Tags        admin
// @Security    BearerAuth
// @Produce     json
// @Success     200 {array} InventoryItem
// @Failure     400 {object} ErrorResponse
// @Router      /admin/inventory [get]
func listInventory(c *gin.Context) {
	rows, err := db.Query(context.Background(), inventorySelectSQL+` ORDER BY i.created_at DESC`)
	if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
	defer rows.Close()
	var items []InventoryItem
	for rows.Next() {
		item, err := scanInventoryRow(rows)
		if err != nil {fmt.Println("Yo, sup ma boy"); c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
		items = append(items, item)
	}
	if items == nil { items = []InventoryItem{} }
	c.JSON(http.StatusOK, items)
}

// getInventoryItem godoc
// @Summary     [Admin]Get an inventory item
// @Tags        admin
// @Security    BearerAuth
// @Produce     json
// @Param       id   path int              true "Inventory ID"
// @Success     200 {object} InventoryItem
// @Failure     400 {object} ErrorResponse
// @Router      /admin/inventory{id} [get]
func getInventoryItem(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	item, err := scanInventoryRow(db.QueryRow(context.Background(), inventorySelectSQL+` WHERE i.id=$1`, id))
	if err != nil { c.JSON(http.StatusNotFound, ErrorResponse{Error: "not found"}); return }
	c.JSON(http.StatusOK, item)
}

// createInventoryItem godoc
// @Summary     [Admin]Create an inventory item
// @Tags        admin
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       body body InventoryInput true "Inventory data"
// @Success     200 {object} IDResponse
// @Failure     400 {object} ErrorResponse
// @Router      /admin/inventory [post]
func createInventoryItem(c *gin.Context) {
	var in InventoryInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()}); return
	}
	var id int
	err := db.QueryRow(context.Background(),
		`INSERT INTO inventory (inventory_number,category_id,name,date_received,shelf_life_days,
		 expiry_date,manufacturer_id,price,quantity,image_url,description)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
		in.InventoryNumber, in.CategoryID, in.Name, in.DateReceived, in.ShelfLifeDays,
		in.ExpiryDate, in.ManufacturerID, in.Price, in.Quantity, in.ImageURL, in.Description,
	).Scan(&id)
	if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
	c.JSON(http.StatusCreated, IDResponse{ID: id})
}
// updateInventoryItem godoc
// @Summary     [Admin]Update an inventory item
// @Tags        admin
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       id   path int              true "Inventory ID"
// @Param       body body InventoryInput true "Inventory data"
// @Success     200 {object} UpdatedResponse
// @Failure     400 {object} ErrorResponse
// @Router      /admin/inventory/{id} [put]
func updateInventoryItem(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var in InventoryInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()}); return
	}
	_, err := db.Exec(context.Background(),
		`UPDATE inventory SET inventory_number=$1,category_id=$2,name=$3,date_received=$4,
		 shelf_life_days=$5,expiry_date=$6,manufacturer_id=$7,price=$8,quantity=$9,
		 image_url=$10,description=$11,updated_at=NOW() WHERE id=$12`,
		in.InventoryNumber, in.CategoryID, in.Name, in.DateReceived, in.ShelfLifeDays,
		in.ExpiryDate, in.ManufacturerID, in.Price, in.Quantity, in.ImageURL, in.Description, id,
	)
	if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
	c.JSON(http.StatusOK, UpdatedResponse{Updated: true})
}

// updateInventoryItem godoc
// @Summary     [Admin]Update an inventory item
// @Tags        admin
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       id   path int              true "Inventory ID"
// @Success     200 {object} DeletedResponse
// @Failure     400 {object} ErrorResponse
// @Router      /admin/inventory/{id} [delete]
func deleteInventoryItem(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	_, err := db.Exec(context.Background(), `DELETE FROM inventory WHERE id=$1`, id)
	if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
	c.JSON(http.StatusOK, DeletedResponse{Deleted: true})
}
