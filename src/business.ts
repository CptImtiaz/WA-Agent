// Everything the assistant knows about Sultana Food Industry, including its
// meat range and Nusa Burger (sourced from MeatGrocer; the bot never says so).
// Edit this file to change products, prices, policies or tone.
// Anything not written here, the assistant will not claim as fact.

export const BUSINESS_INFO = `
# PART A: Sultana Food Industry (laddoo, sweets, desserts, drinks)

Malaysian maker of traditional laddoo, chilled desserts and drinks, handcrafted
for walimah, kenduri, weddings, corporate events, hotels & cafés, Hari Raya and
Deepavali. Freshly made daily, quality ingredients, individual packaging,
timely delivery across Malaysia.

## Laddoo
- Laddoo Trays: golden, fragrant laddoo arranged on trays for kenduri, open
  houses and family gatherings.
- "Thank You" Wedding Favours: each laddoo sealed in its own floral Thank You
  pouch, ready to hand to every guest at a walimah.
- Signature Gift Box: six premium laddoo with cashew, pistachio and silver leaf
  in the maroon "S" box. Good for corporate gifts and Hari Raya.

## Desserts & drinks (served by the bowl, glass or in bulk for a majlis)
- Lai Chee Kang: lychee, longan, red dates, white fungus, barley and grass jelly
  in a light, chilled syrup. Pencuci mulut tradisional, dibuat segar setiap hari.
- Air Limau Jelly: fresh calamansi lime with colourful jelly, nata de coco and
  selasih seeds over ice. A cooler for outdoor kenduri.

## Wedding & event packages
Every laddoo in a package is individually packed in a Thank You pouch.
- 100 pcs: for small events
- 500 pcs: most popular choice for weddings
- 1000 pcs: for large functions

## Events & catering
Dessert table setups with laddoo towers, Lai Chee Kang and chilled drinks,
styled to match the celebration: garden receptions, banquet dessert tables,
guest gifts.

## Distributors / stockists
Sweet shops, mini markets, cafés and resellers can apply to become a stockist:
wholesale pricing, steady supply and point-of-sale display support.

## How ordering works
1. Customer shares event date, quantity, product and delivery area.
2. The team confirms availability and sends a quote; customer picks packaging
   and locks in the date.
3. Sultana makes the order fresh and delivers on time anywhere in Malaysia.

## Prices
Prices are quoted by the team per order (they depend on quantity, packaging,
date and delivery area). Do not state any price, discount or delivery fee.
Collect the details and say the team will send a quote.
(This rule is for laddoo, desserts and drinks only. Meat prices are listed in
Part B and may be shared.)

# PART B: Meat products & Nusa Burger

Sultana Food Industry also offers fresh frozen, 100% halal meat delivered to
your door: premium Australian beef and lamb, Flavorista products and Nusa
Burger patties. The Australian beef and lamb come from an accredited farm and
abattoir in Australia that exports to more than 50 countries. Local meat and
chicken come from certified halal sources in Malaysia.
Online shop for the meat range: https://www.meatgrocer.com (delivery or
pickup). Nusa Burger: https://www.meatgrocer.com/shop-1. Promo sets:
https://www.meatgrocer.com/shop
(Present these as Sultana Food Industry's own meat range. Share the shop link
only as the place to order online; never talk about MeatGrocer or Nusantara
Meat Berhad as a supplier, and never say Sultana resells someone else's
products.)

Halal & accreditation: all meat products are 100% halal. Malaysian halal
MS 1500, JAKIM, DVS certified importer; Australian halal accredited.

## Current prices (RM, per pack; prices and stock change, the team has the
## latest)
Australian beef:
- Striploin 180g RM25.50 • Cube Roll / Rib Eye 180g RM28.40 • Tenderloin 200g RM34.90
- Short Ribs (cube cut) 500g RM43.00 • Topside (cube cut) 500g RM34.40
- Beef Shabu Shabu / beef slice 200g RM22.20 (hot seller) • D-Rump 200g RM17.40
- Minced Beef 500g RM26.70 • Brisket N/E 500g RM36.60 • Brisket P/E 500g RM36.00
- Knuckle, Chuck Tender, Clod: currently unavailable
Australian lamb:
- Minced Lamb 500g RM41.00 • Lamb Shabu Shabu 200g RM23.00
- Lamb Shoulder 500g RM24.90 • Lamb Cube Cut 500g RM22.50 • Lamb Cutlet 500g RM38.80
- Lamb Neck Bone 500g RM20.80 • Lamb Chump 500g RM17.00 • Lamb Loin 500g RM38.80
- Lamb Boneless 500g RM40.90 • Lamb Shank 1kg RM47.60 • Lamb Flap 1kg RM33.90
- Lamb Leg Chump Off (1.7-2.2kg) RM106.90 • Lamb Marrow Bone (gearbox) 1kg RM20.60
Flavorista & smallgoods:
- Flavorista Premium Burger 120g x 2 pcs RM15.90 (new)
- Flavorista Wagyu Burger 120g x 2 pcs RM19.90 (new)
- Flavorista Marinated Lamb 1kg RM65.30 (hot seller)
- Marinated Chicken, Royal Kunyit style (turmeric) 1.2-1.5kg RM18.60
Offals (often out of stock): Lungs 500g RM5.10 • Liver 500g RM3.70 •
Spleen 500g RM3.10 • Honeycomb Tripes 200g RM7.30 • Tripes 200g RM4.80
Promo sets:
- Go 100% Beef Promo RM99 • Flavorista Australian Wagyu Burger Promo RM85
- Mini Mix Selection Promo RM136 • 8x Shabu Shabu Promo (beef slices) RM145
- SteakSet for Two RM196 • SteakSet Max RM293
- Wholesome Family & Friends Set RM399 • The Super Saver Promo RM456
- The 24 Steak Cut Set Promo RM543 • Topside Cube Cut Promo RM113 (out of stock)
Some items are often out of stock. Never promise stock; say the team will
confirm.

## Nusa Burger ("Nusa, Tiada Tandingan")
Frozen burger patties, 100g per patty, 5 patties per pack.
- Nusa Beef Burger (Burger Daging Lembu): RM15.80 per pack
- Nusa Lamb Burger (Burger Daging Kambing): RM22.20 per pack
- Nusa Chicken Burger (Burger Daging Ayam): shown on the campaign posters;
  the team confirms price and availability.
- Beef and lamb are halal Australian meat; the chicken burger is made from
  clean, fresh, halal chicken. "Rasa burger yang padu & nikmat."
- NUSA Burger PROMO: 7 packs (35 patties), mix beef and lamb packs as the
  customer likes. From RM104; the exact price depends on the mix, and the team
  confirms it.

## Nusa Burger stall campaign (Program Keusahawanan Nusa Burger)
"Jana pendapatan dan gandakan keuntungan. BUKA GERAI BURGER, RM500 sebulan
sehingga 6 bulan, dengan hanya membeli burger patty Nusa Burger sahaja."
- You are free to set your own selling price, use your own recipe, and buy
  other wet ingredients yourself. Only the patties are bought from Nusa
  ("Resepi anda tentukan sendiri, hanya beli patty dari kami"; bun, onion,
  pickles, cheese, egg and vegetables you buy yourself).
- What we give: Nusa burger stall (code NUSA001), LED lamp, griller pan, cast
  iron stove, scraper, masher, bread knife, apron, cap. Marketing of your stall
  on Nusa Burger social media (stall info, location, menu, promotions).
  Guaranteed patty stock: stall price, stock available, delivery straight to
  the stall.
- How to start (Cara untuk bermula): 1) choose a location to trade;
  2) contact us or register (here in this chat is fine); 3) pay a deposit; 4) sign the terms
  and agreement; 5) the stall and Nusa Burger stock are delivered to the agreed
  location.
- Contact for the campaign: +6016-800 9417 (this WhatsApp).
- What RM500 means: the operator pays RM500 a month, for up to 6 months, for
  the stall package (stall NUSA001 with all the equipment above, marketing on
  Nusa social media and guaranteed patty supply). The only other condition is
  that the operator buys their burger patties from Nusa Burger.
  In BM: "Anda bayar RM500 sebulan, sehingga 6 bulan, untuk pakej gerai
  lengkap. Syaratnya, beli patty burger dari Nusa sahaja."
- Explain this campaign fully and enthusiastically when asked: what it is,
  the RM500 a month for up to 6 months, what's included, the freedom to set
  your own price and recipe, and the 5 steps to start.
- Deposit amount and full contract terms: not written here yet, so say the
  team will give the exact deposit and agreement when they register. Do not
  guess an amount.

## Ordering meat products
- Order online at https://www.meatgrocer.com, or tell us here what you want
  and the team will arrange it.
- Payment: the team gives payment details. For payment, hand off to the team.
- Delivery: Klang Valley, Kuala Lumpur, Selangor and Putrajaya. Minimum order
  RM120, and free delivery within Klang Valley for orders of RM120 and above
  (limited-time offer). The team confirms other delivery charges.
- Orders placed before 12pm are delivered the same day; after 12pm, the next
  day. Delivery Monday to Friday; closed Saturday, Sunday and KL public
  holidays. The team confirms the delivery slot.
- Every delivery comes with a free thermal bag to keep the meat frozen.
  The courier can leave it at the guardhouse.
- Damaged or missing items: frozen goods can't be returned, but refunds are
  possible after review. Ask for a photo and hand off to the team.
- Retailers looking for a meat supplier: collect their business details here
  (record_order_enquiry with product "Meat supplier enquiry").

## Meat care tips
- Meat is blast frozen at -40°C and vacuum sealed, so it keeps up to a year in
  the freezer. It looks darker in the pack because there's no oxygen; it turns
  bright red again once thawed.
- Thaw in the fridge for 12-24 hours, or in a bowl under slow-running tap
  water. Never thaw meat in the microwave.
- Once opened, keep it in the fridge no more than 24 hours, otherwise freeze it
  again. Store packs in the freezer as soon as they arrive.
`.trim();
