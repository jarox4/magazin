package main

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type OrderItem struct {
	ID          int     `json:"id"`
	InventoryID int     `json:"inventory_id"`
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	Subtotal    float64 `json:"subtotal"`
}

type Order struct {
	ID         int         `json:"id"`
	UserID     int         `json:"user_id"`
	Status     string      `json:"status"`
	TotalPrice float64     `json:"total_price"`
	Address    string      `json:"address"`
	Phone      string      `json:"phone"`
	Notes      *string     `json:"notes"`
	Items      []OrderItem `json:"items"`
	CreatedAt  time.Time   `json:"created_at"`
	UpdatedAt  time.Time   `json:"updated_at"`
}

type OrderItemInput struct {
	InventoryID int `json:"inventory_id" binding:"required"`
	Quantity    int `json:"quantity"     binding:"required,min=1"`
}

type CreateOrderInput struct {
	Address string           `json:"address" binding:"required"`
	Phone   string           `json:"phone"   binding:"required"`
	Notes   string           `json:"notes"`
	Items   []OrderItemInput `json:"items"   binding:"required,min=1"`
}

type UpdateOrderInput struct {
	Status string `json:"status" binding:"required,oneof=pending confirmed shipped delivered cancelled"`
}

func loadOrderItems(ctx context.Context, orderID int) ([]OrderItem, float64, error) {
	rows, err := db.Query(ctx, `
		SELECT oi.id, oi.inventory_id, i.name, oi.quantity, oi.unit_price, oi.subtotal
		FROM order_items oi JOIN inventory i ON oi.inventory_id = i.id
		WHERE oi.order_id = $1`, orderID)
	if err != nil { return nil, 0, err }
	defer rows.Close()
	var items []OrderItem
	var total float64
	for rows.Next() {
		var it OrderItem
		rows.Scan(&it.ID, &it.InventoryID, &it.ProductName, &it.Quantity, &it.UnitPrice, &it.Subtotal)
		total += it.Subtotal
		items = append(items, it)
	}
	if items == nil { items = []OrderItem{} }
	return items, total, nil
}

// listMyOrders godoc
// @Summary     List current user's orders
// @Tags        orders
// @Security    BearerAuth
// @Produce     json
// @Success     200 {array}  Order
// @Router      /orders [get]
func listMyOrders(c *gin.Context) {
	uid := c.GetInt("userID")
	rows, err := db.Query(context.Background(),
		`SELECT id, user_id, status, total_price, address, phone, notes, created_at, updated_at
		 FROM orders WHERE user_id=$1 ORDER BY created_at DESC`, uid)
	if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
	defer rows.Close()
	var orders []Order
	for rows.Next() {
		var o Order
		rows.Scan(&o.ID, &o.UserID, &o.Status, &o.TotalPrice, &o.Address, &o.Phone, &o.Notes, &o.CreatedAt, &o.UpdatedAt)
		o.Items, _, _ = loadOrderItems(context.Background(), o.ID)
		orders = append(orders, o)
	}
	if orders == nil { orders = []Order{} }
	c.JSON(http.StatusOK, orders)
}

// getOrder godoc
// @Summary     Get order by ID (own orders only)
// @Tags        orders
// @Security    BearerAuth
// @Produce     json
// @Param       id path int true "Order ID"
// @Success     200 {object} Order
// @Failure     404 {object} ErrorResponse
// @Router      /orders/{id} [get]
func getOrder(c *gin.Context) {
	uid := c.GetInt("userID")
	id, _ := strconv.Atoi(c.Param("id"))
	var o Order
	err := db.QueryRow(context.Background(),
		`SELECT id, user_id, status, total_price, address, phone, notes, created_at, updated_at
		 FROM orders WHERE id=$1 AND user_id=$2`, id, uid,
	).Scan(&o.ID, &o.UserID, &o.Status, &o.TotalPrice, &o.Address, &o.Phone, &o.Notes, &o.CreatedAt, &o.UpdatedAt)
	if err != nil { c.JSON(http.StatusNotFound, ErrorResponse{Error: "не найден"}); return }
	o.Items, _, _ = loadOrderItems(context.Background(), o.ID)
	c.JSON(http.StatusOK, o)
}

// createOrder godoc
// @Summary     Place an order
// @Tags        orders
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       body body CreateOrderInput true "Order data"
// @Success     201 {object} Order
// @Failure     400 {object} ErrorResponse
// @Router      /orders [post]
func createOrder(c *gin.Context) {
	uid := c.GetInt("userID")
	var in CreateOrderInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()}); return
	}

	ctx := context.Background()
	tx, err := db.Begin(ctx)
	if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
	defer tx.Rollback(ctx)

	var orderID int
	err = tx.QueryRow(ctx,
		`INSERT INTO orders (user_id, address, phone, notes) VALUES ($1,$2,$3,$4) RETURNING id`,
		uid, in.Address, in.Phone, in.Notes,
	).Scan(&orderID)
	if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }

	var total float64
	for _, item := range in.Items {
		var price float64; var stock int
		err = tx.QueryRow(ctx,
			`SELECT price, quantity FROM inventory WHERE id=$1 FOR UPDATE`, item.InventoryID,
		).Scan(&price, &stock)
		if err != nil { c.JSON(http.StatusBadRequest, ErrorResponse{Error: "продукт не найден"}); return }
		if stock < item.Quantity {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "недостаточно товара"}); return
		}
		_, err = tx.Exec(ctx,
			`INSERT INTO order_items (order_id, inventory_id, quantity, unit_price) VALUES ($1,$2,$3,$4)`,
			orderID, item.InventoryID, item.Quantity, price)
		if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
		_, err = tx.Exec(ctx, `UPDATE inventory SET quantity=quantity-$1 WHERE id=$2`, item.Quantity, item.InventoryID)
		if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
		total += price * float64(item.Quantity)
	}

	_, err = tx.Exec(ctx, `UPDATE orders SET total_price=$1 WHERE id=$2`, total, orderID)
	if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }

	if err = tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return
	}

	var o Order
	db.QueryRow(ctx,
		`SELECT id, user_id, status, total_price, address, phone, notes, created_at, updated_at FROM orders WHERE id=$1`, orderID,
	).Scan(&o.ID, &o.UserID, &o.Status, &o.TotalPrice, &o.Address, &o.Phone, &o.Notes, &o.CreatedAt, &o.UpdatedAt)
	o.Items, _, _ = loadOrderItems(ctx, orderID)
	c.JSON(http.StatusCreated, o)
}

// cancelOrder godoc
// @Summary     Cancel an order (only if pending)
// @Tags        orders
// @Security    BearerAuth
// @Produce     json
// @Param       id path int true "Order ID"
// @Success     200 {object} UpdatedResponse
// @Failure     400 {object} ErrorResponse
// @Router      /orders/{id} [delete]
func cancelOrder(c *gin.Context) {
	uid := c.GetInt("userID")
	id, _ := strconv.Atoi(c.Param("id"))
	var status string
	err := db.QueryRow(context.Background(),
		`SELECT status FROM orders WHERE id=$1 AND user_id=$2`, id, uid,
	).Scan(&status)
	if err != nil { c.JSON(http.StatusNotFound, ErrorResponse{Error: "не найден"}); return }
	if status != "pending" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "отменить можно только заказы 'в процессе'"}); return
	}
	db.Exec(context.Background(), `UPDATE orders SET status='cancelled', updated_at=NOW() WHERE id=$1`, id)
	c.JSON(http.StatusOK, UpdatedResponse{Updated: true})
}

// adminListOrders godoc
// @Summary     [Admin] List all orders
// @Tags        admin
// @Security    BearerAuth
// @Produce     json
// @Success     200 {array} Order
// @Router      /admin/orders [get]
func adminListOrders(c *gin.Context) {
	rows, err := db.Query(context.Background(),
		`SELECT id, user_id, status, total_price, address, phone, notes, created_at, updated_at
		 FROM orders ORDER BY created_at DESC`)
	if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
	defer rows.Close()
	var orders []Order
	for rows.Next() {
		var o Order
		rows.Scan(&o.ID, &o.UserID, &o.Status, &o.TotalPrice, &o.Address, &o.Phone, &o.Notes, &o.CreatedAt, &o.UpdatedAt)
		o.Items, _, _ = loadOrderItems(context.Background(), o.ID)
		orders = append(orders, o)
	}
	if orders == nil { orders = []Order{} }
	c.JSON(http.StatusOK, orders)
}

// adminUpdateOrder godoc
// @Summary     [Admin] Update order status
// @Tags        admin
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       id   path int              true "Order ID"
// @Param       body body UpdateOrderInput true "New status"
// @Success     200 {object} UpdatedResponse
// @Router      /admin/orders/{id} [put]
func adminUpdateOrder(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var in UpdateOrderInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()}); return
	}
	_, err := db.Exec(context.Background(),
		`UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2`, in.Status, id)
	if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
	c.JSON(http.StatusOK, UpdatedResponse{Updated: true})
}
