import { useEffect, useState } from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { supabase } from "./supabase";
import PickupCheckout from "./PickupCheckout";
import "./App.css";

/* LOGOS */

import appleLogo from "./assets/logos/apple.svg";
import samsungLogo from "./assets/logos/samsung.png";
import oppoLogo from "./assets/logos/oppo.png";
import vivoLogo from "./assets/logos/vivo.svg";
import xiaomiLogo from "./assets/logos/xiaomi.svg";
import motorolaLogo from "./assets/logos/motorola1.svg";
import oneplusLogo from "./assets/logos/oneplus.svg"; 
import iqooLogo from "./assets/logos/iqoo.svg";
import realmeLogo from "./assets/logos/realme.svg";
import redmiLogo from "./assets/logos/redmi.svg";
import pocoLogo from "./assets/logos/poco.svg";

/* PHONE IMAGES */

const getPhoneImage = (model) => {
  if (!model) return null;

  const filename = model
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

  return `/phones/${filename}.png`;
};

function highlightModel(text, search) {
  if (!text || !search.trim()) return text;

  const searchText = search.trim();

  const escapedSearch = searchText.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(`(${escapedSearch})`, "gi");

  return text.split(regex).map((part, index) => {
    if (part.toLowerCase() === searchText.toLowerCase()) {
      return (
        <span
          key={index}
          className="bg-cyan-400 text-black px-1.5 rounded-md font-bold"
        >
          {part}
        </span>
      );
    }

    return part;
  });
}

  export default function App() {
  const [phones, setPhones] = useState([]);
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [addedProductId, setAddedProductId] = useState(null);
  const [stockLimitMessage, setStockLimitMessage] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("mm-times-cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("mm-times-cart", JSON.stringify(cart));
  }, [cart]);

    useEffect(() => {
    const channel = supabase
      .channel("products-stock-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        (payload) => {
          const updatedProduct = payload.new;
          const deletedProduct = payload.old;

          // Handle product updates and new products
          if (updatedProduct && updatedProduct.id) {
            setProducts((currentProducts) => {
              const exists = currentProducts.some(
                (product) => product.id === updatedProduct.id
              );

              if (!updatedProduct.is_active) {
                return currentProducts.filter(
                  (product) => product.id !== updatedProduct.id
                );
              }

              if (exists) {
                return currentProducts.map((product) =>
                  product.id === updatedProduct.id
                    ? { ...product, ...updatedProduct }
                    : product
                );
              }

              return [...currentProducts, updatedProduct];
            });

            
            // Update stock and correct cart quantity if stock decreases
            setCart((currentCart) =>
              currentCart.map((item) => {
                if (String(item.id) !== String(updatedProduct.id)) {
                  return item;
                }

                const latestStock = Math.max(
                  0,
                  Number(updatedProduct.stock) || 0
                );

                const correctedQuantity = Math.min(
                  item.quantity,
                  latestStock
                );

                if (item.quantity > latestStock) {
                  setStockLimitMessage(
                    latestStock === 0
                      ? `${updatedProduct.product_name} is now out of stock and has been removed from your available quantity.`
                      : `Stock for ${updatedProduct.product_name} has changed. Your cart quantity was reduced to ${latestStock}.`
                  );
                }

                return {
                  ...item,
                  stock: latestStock,
                  quantity: correctedQuantity,
                  price:
                    updatedProduct.sale_price ??
                    updatedProduct.price,
                  product_name: updatedProduct.product_name,
                };
              })
            );

          }

          // Handle product deletion
          if (payload.eventType === "DELETE" && deletedProduct?.id) {
            setProducts((currentProducts) =>
              currentProducts.filter(
                (product) => product.id !== deletedProduct.id
              )
            );

            setCart((currentCart) =>
              currentCart.filter(
                (item) => item.id !== deletedProduct.id
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Product stock Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [showPickupCheckout, setShowPickupCheckout] = useState(false);
  const [showCompatibilityInfo, setShowCompatibilityInfo] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchMode, setSearchMode] = useState("phones");
  const [expandedTemper, setExpandedTemper] = useState(null);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [phoneImage, setPhoneImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWordTransition, setShowWordTransition] = useState(false);
  const [showLoaderQuote, setShowLoaderQuote] = useState(false);
  const [startWordFlight, setStartWordFlight] = useState(false);
  const heroImages = [
    "/images/hero1.jpg",
    "/images/hero2.jpg",
    "/images/hero3.jpg",
  ];

  const [heroIndex, setHeroIndex] = useState(0);
  const [heroSlides, setHeroSlides] = useState([]);


  useEffect(() => {
    if (heroSlides.length <= 1) {
      setHeroIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [heroSlides.length]);


  useEffect(() => {
    async function fetchHeroSlides() {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Hero slides error:", error);
        return;
      }

      setHeroSlides(data || []);
    }

    fetchHeroSlides();
  }, []);


  const brands = [
    "Apple",
    "Samsung",
    "OPPO",
    "Vivo",
    "IQOO",
    "Redmi",
    "Xiaomi",
    "Poco",
    "Motorola",
    "Realme",
    "OnePlus",
  ];

  const brandIcons = {
    Apple: appleLogo,
    Samsung: samsungLogo,
    OPPO: oppoLogo,
    Vivo: vivoLogo,
    IQOO: iqooLogo,
    Redmi: redmiLogo,
    Xiaomi: xiaomiLogo,
    Poco: pocoLogo,
    Motorola: motorolaLogo,
    Realme: realmeLogo,
    OnePlus: oneplusLogo,
  };

  useEffect(() => {
    fetchPhones();
  }, []);
 useEffect(() => {
  const loadPhoneImage = async () => {
    if (!selectedPhone?.model) {
      setPhoneImage(null);
      setImageLoading(false);
      return;
    }

    // 1. Use cached Supabase image
    if (selectedPhone.image_url) {
      setPhoneImage(selectedPhone.image_url);
      setImageLoading(false);
      return;
    }

    setPhoneImage(null);
    setImageLoading(true);

    // 2. Check user's local PNG
    const localImage = getPhoneImage(selectedPhone.model);
    const testImage = new Image();

    testImage.onload = () => {
      setPhoneImage(localImage);
      setImageLoading(false);
    };

    testImage.onerror = () => {
      // 3. Check user's local WebP
      const webpImage = localImage.replace(".png", ".webp");
      const testWebP = new Image();

      testWebP.onload = () => {
        setPhoneImage(webpImage);
        setImageLoading(false);
      };

      testWebP.onerror = async () => {
        // 4. No local image → MobileAPI
        const { data, error } =
          await supabase.functions.invoke(
            "dynamic-service",
            {
              body: {
                model: selectedPhone.model,
                brand: selectedPhone.brand,
              },
            }
          );

        if (!error && data?.image_url) {
          setPhoneImage(data.image_url);
        } else {
          setPhoneImage(null);
        }

        setImageLoading(false);
      };

      testWebP.src = webpImage;
    };

    testImage.src = localImage;
  };

  loadPhoneImage();
}, [selectedPhone]);

  async function fetchPhones() {
  try {
    // Get all phone models
    const { data: phoneData, error: phoneError } = await supabase
      .from("phones_v2")
      .select("id, brand, model, image_url");

    if (phoneError) {
      console.error("Phones error:", phoneError);
      return;
    }

    // Get all tempered-glass compatibility relationships
    const { data: compatibilityData, error: compatibilityError } =
      await supabase
        .from("tempered_compatibility")
        .select("group_id, phone_id, fit");

    if (compatibilityError) {
      console.error("Compatibility error:", compatibilityError);
      return;
    }

    // Get tempered-glass groups
    const { data: groupData, error: groupError } = await supabase
      .from("tempered_groups")
      .select("group_id, reference_model, fit");

    if (groupError) {
      console.error("Groups error:", groupError);
      return;
    }
    // Get active products
const { data: productData, error: productError } = await supabase
  .from("products")
  .select(
    "id, product_name, category, brand, price, sale_price, description, image_url, stock, is_active"
  )
  .eq("is_active", true);

if (productError) {
  console.error("Products error:", productError);
  return;
}

// Get product-phone compatibility
const { data: productCompatibilityData, error: productCompatibilityError } =
  await supabase
    .from("product_compatibility")
    .select("product_id, phone_id");

if (productCompatibilityError) {
  console.error(
    "Product compatibility error:",
    productCompatibilityError
  );
  return;
}

setProducts(productData || []);

    // Connect everything together
    const combinedPhones = phoneData.map((phone) => {
      const matches = compatibilityData
        .filter((item) => item.phone_id === phone.id)
        .map((item) => {
          const group = groupData.find(
            (g) => g.group_id === item.group_id
          );

          return {
            group_id: item.group_id,
            reference_model: group?.reference_model || "Unknown",
            fit: item.fit,
          };
        });
        
        const productMatches = productCompatibilityData
  .filter((item) => {
    const compatiblePhone = phoneData.find(
      (p) => p.id === item.phone_id
    );

    if (!compatiblePhone) return false;

    const currentPhoneKey =
      `${phone.brand}|${phone.model}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const compatiblePhoneKey =
      `${compatiblePhone.brand}|${compatiblePhone.model}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    return (
      item.phone_id === phone.id ||
      compatiblePhoneKey === currentPhoneKey
    );
  })
  .map((item) =>
    productData.find(
      (product) =>
        String(product.id).trim() ===
        String(item.product_id).trim()
)
  )
  .filter(Boolean);


      return {
  id: phone.id,
  brand: phone.brand,
  model: phone.model,
  image_url: phone.image_url,
  temperedGroups: matches,
  compatibleProducts: productMatches,
};
    });

    setPhones(combinedPhones);
    console.log("TOTAL PHONES:", combinedPhones.length);
console.log("FIRST PHONE:", combinedPhones[0]);
console.log("ALL PHONES:", combinedPhones);

{/* Start the word transition after 3 seconds */}
 setTimeout(() => {
  setShowWordTransition(true);
}, 3000);

{/* Start the word animation after 7 seconds */}
setTimeout(() => {
  setStartWordFlight(true);
}, 7000);

{/* Show the loader quote after 4 seconds */}
setTimeout(() => {
  setShowLoaderQuote(true);
}, 4000);

{/* Hide the full loader after 9 seconds */}
setTimeout(() => {
  setLoading(false);
}, 9000);


} catch (error) {
  console.error("Unexpected error:", error);
}
}

  const normalizeSearch = (text) => {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

const levenshteinDistance = (a, b) => {
  if (!a) return b.length;
  if (!b) return a.length;

  const matrix = Array.from(
    { length: b.length + 1 },
    () => Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= b.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j - 1] + 1
            );
    }
  }

  return matrix[b.length][a.length];
};

const getSearchScore = (phone, query) => {
  if (!query.trim()) return 0;

  const brandAliases = {
    ip: "iphone",
    iphone: "iphone",

    sam: "samsung",
    samsung: "samsung",

    galxy: "galaxy",
    galaxy: "galaxy",

    opp: "oppo",
    oppo: "oppo",

    viv: "vivo",
    vivo: "vivo",

    iq: "iqoo",
    iqoo: "iqoo",

    red: "redmi",
    redmi: "redmi",

    xia: "xiaomi",
    xiaomi: "xiaomi",

    poc: "poco",
    poco: "poco",

    mot: "motorola",
    moto: "motorola",
    motorola: "motorola",

    real: "realme",
    realme: "realme",

    one: "oneplus",
    oneplus: "oneplus",
  };

  const clean = (text) =>
    (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normalize = (text) =>
    clean(text).replace(/\s/g, "");

  const levenshtein = (a, b) => {
    if (!a || !b) return Math.max(a.length, b.length);

    const matrix = Array.from(
      { length: a.length + 1 },
      () => Array(b.length + 1).fill(0)
    );

    for (let i = 0; i <= a.length; i++) {
      matrix[i][0] = i;
    }

    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;

        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[a.length][b.length];
  };

  const queryClean = clean(query);
  const queryWords = queryClean.split(" ").filter(Boolean);
  const queryNormalized = normalize(query);

  const phoneModel = clean(phone.model);
  const phoneBrand = clean(phone.brand);

  const phoneModelNormalized = normalize(phone.model);
  const phoneBrandNormalized = normalize(phone.brand);

  let bestScore = 0;

  /*
   * ----------------------------------------------------
   * 1. BRAND SEARCH
   * ----------------------------------------------------
   * Handles:
   * re
   * realme
   * realmee
   * oppo
   * opp
   * vivo
   * samsung
   * sam
   * iphone
   * ip
   * etc.
   */

  const possibleBrand =
    queryWords.length === 1
      ? brandAliases[queryWords[0]] || queryWords[0]
      : null;

  if (possibleBrand) {
    const brandQuery = normalize(possibleBrand);

    if (
      phoneBrandNormalized === brandQuery
    ) {
      bestScore = Math.max(bestScore, 120000);
    }

    if (
      phoneBrandNormalized.startsWith(brandQuery)
    ) {
      bestScore = Math.max(bestScore, 110000);
    }

    if (
      phoneBrandNormalized.includes(brandQuery)
    ) {
      bestScore = Math.max(bestScore, 100000);
    }

    const brandDistance = levenshtein(
      queryNormalized,
      phoneBrandNormalized
    );

    const allowedBrandDistance =
      queryNormalized.length <= 3
        ? 1
        : queryNormalized.length <= 6
        ? 2
        : 3;

    if (brandDistance <= allowedBrandDistance) {
      bestScore = Math.max(
        bestScore,
        90000 - brandDistance * 1000
      );
    }
  }

  /*
   * ----------------------------------------------------
   * 2. NORMAL MODEL SEARCH
   * ----------------------------------------------------
   */

  const getModelKey = (text) => {
    const words = clean(text)
      .split(" ")
      .filter(Boolean);

    const modelWords = words.filter((word) => {
      const mapped = brandAliases[word];

      if (mapped) return false;

      if (
        [
          "phone",
          "mobile",
          "smartphone",
          "apple",
        ].includes(word)
      ) {
        return false;
      }

      return true;
    });

    return modelWords.join("");
  };

  const searchKey = getModelKey(query);

  if (searchKey) {
    /*
     * ACTUAL PHONE MODEL
     */

    if (phoneModelNormalized === searchKey) {
      bestScore = Math.max(bestScore, 100000);
    } else if (
      phoneModelNormalized.startsWith(searchKey)
    ) {
      bestScore = Math.max(bestScore, 98000);
    } else if (
      phoneModelNormalized.includes(searchKey)
    ) {
      bestScore = Math.max(bestScore, 96000);
    }

    /*
     * FUZZY ACTUAL MODEL
     */

    const modelDistance = levenshtein(
      searchKey,
      phoneModelNormalized
    );

    const allowedDistance =
      searchKey.length <= 3
        ? 1
        : searchKey.length <= 6
        ? 2
        : 3;

    if (modelDistance <= allowedDistance) {
      bestScore = Math.max(
        bestScore,
        50000 - modelDistance * 1000
      );
    }
  }

  /*
   * ----------------------------------------------------
   * 3. COMPATIBLE TEMPER MODEL SEARCH
   * ----------------------------------------------------
   */

  (phone.temperedGroups || []).forEach((item) => {
    const referenceModel = clean(
      item.reference_model
    );

    const referenceNormalized = normalize(
      item.reference_model
    );

    /*
     * BRAND SEARCH INSIDE COMPATIBLE MODEL
     */

    if (possibleBrand) {
      const referenceWords =
        referenceModel.split(" ");

      const referenceBrand =
        referenceWords.length > 0
          ? referenceWords[0]
          : "";

      const referenceBrandNormalized =
        normalize(referenceBrand);

      if (
        referenceBrandNormalized ===
        normalize(possibleBrand)
      ) {
        bestScore = Math.max(
          bestScore,
          115000
        );
      }

      if (
        referenceBrandNormalized.startsWith(
          normalize(query)
        )
      ) {
        bestScore = Math.max(
          bestScore,
          108000
        );
      }
    }

    /*
     * MODEL SEARCH
     */

    if (searchKey) {
      const compatibleKey =
        getModelKey(item.reference_model);

      if (!compatibleKey) return;

      if (compatibleKey === searchKey) {
        bestScore = Math.max(
          bestScore,
          99000
        );
      } else if (
        compatibleKey.startsWith(searchKey)
      ) {
        bestScore = Math.max(
          bestScore,
          97000
        );
      } else if (
        compatibleKey.includes(searchKey)
      ) {
        bestScore = Math.max(
          bestScore,
          95000
        );
      }

      /*
       * FUZZY COMPATIBLE MODEL
       */

      const compatibleDistance =
        levenshtein(
          searchKey,
          compatibleKey
        );

      const allowedDistance =
        searchKey.length <= 3
          ? 1
          : searchKey.length <= 6
          ? 2
          : 3;

      if (
        compatibleDistance <=
        allowedDistance
      ) {
        bestScore = Math.max(
          bestScore,
          49000 -
            compatibleDistance * 1000
        );
      }
    }

    /*
     * DIRECT TEXT MATCH
     *
     * Helps with one-word / partial searches.
     */

    if (
      queryNormalized.length >= 1 &&
      referenceNormalized.includes(
        queryNormalized
      )
    ) {
      bestScore = Math.max(
        bestScore,
        70000
      );
    }
  });

  /*
   * ----------------------------------------------------
   * 4. DIRECT BRAND TEXT MATCH
   * ----------------------------------------------------
   */

  if (
    queryNormalized.length >= 1 &&
    phoneBrandNormalized.startsWith(
      queryNormalized
    )
  ) {
    bestScore = Math.max(
      bestScore,
      105000
    );
  }

  /*
   * ----------------------------------------------------
   * 5. MODEL TEXT MATCH
   * ----------------------------------------------------
   */

  if (
    queryNormalized.length >= 1 &&
    phoneModelNormalized.includes(
      queryNormalized
    )
  ) {
    bestScore = Math.max(
      bestScore,
      75000
    );
  }

  return bestScore;
};

const getTemperSearchScore = (phone, query) => {
  if (!query.trim()) return 0;

  if (!phone.temperedGroups || phone.temperedGroups.length === 0) {
    return 0;
  }

  let bestScore = 0;

  phone.temperedGroups.forEach((item) => {
    const cleanModel = item.reference_model
      ?.replace(
        new RegExp(
          `^${phone.brand}\\s*`,
          "i"
        ),
        ""
      );

    if (!cleanModel) return;

    const score = getSearchScore(
      {
        model: cleanModel,
        brand: phone.brand,
      },
      query
    );

    bestScore = Math.max(bestScore, score);
  });

  return bestScore;
};

const searchQuery = normalizeSearch(search);

const directMatches = searchQuery
  ? phones.filter((phone) => {
      const model = normalizeSearch(phone.model);
      const brand = normalizeSearch(phone.brand);

      return (
        model.includes(searchQuery) ||
        brand.includes(searchQuery)
      );
    })
  : phones;

const searchSource =
  searchQuery && directMatches.length > 0
    ? directMatches
    : phones;

const filteredPhones = searchSource
  .map((phone) => ({
    ...phone,
    searchScore: getSearchScore(phone, search),
  }))
  .filter((phone) => {
    if (!searchQuery) return true;

    return phone.searchScore > 0;
  })
  .sort((a, b) => {
    return b.searchScore - a.searchScore;
  });

const hasResults = filteredPhones.length > 0;

const temperedResults = [];

phones.forEach((phone) => {
  (phone.temperedGroups || []).forEach((item) => {
    const existing = temperedResults.find(
      (temper) => temper.group_id === item.group_id
    );

    if (existing) {
  // Add every unique fit quality
  if (!existing.fits.includes(item.fit)) {
    existing.fits.push(item.fit);
  }

  // Add every unique compatible phone
  if (
    !existing.compatiblePhones.some(
      (p) => p.id === phone.id
    )
  ) {
    existing.compatiblePhones.push({
      id: phone.id,
      model: phone.model,
      brand: phone.brand,
    });
  }
}
    else {
      temperedResults.push({
        group_id: item.group_id,
        reference_model: item.reference_model,
        fits: [item.fit],
        compatiblePhones: [
          {
            id: phone.id,
            model: phone.model,
            brand: phone.brand,
          },
        ],
      });
    }
  });
});
const filteredTempers = temperedResults
  .map((temper) => {
    let bestScore = 0;

    // Search the temper model itself
    const temperScore = getSearchScore(
      {
        model: temper.reference_model,
        brand: "",
        temperedGroups: [],
      },
      search
    );

    bestScore = Math.max(
      bestScore,
      temperScore
    );

    // Search all compatible phone models
    temper.compatiblePhones.forEach((phone) => {
      const phoneScore = getSearchScore(
        {
          model: phone.model,
          brand: phone.brand,
          temperedGroups: [],
        },
        search
      );

      bestScore = Math.max(
        bestScore,
        phoneScore
      );
    });

    return {
      ...temper,
      searchScore: bestScore,
    };
  })
  .filter((temper) => {
    if (!search.trim()) return true;

    return temper.searchScore > 0;
  })
  .sort((a, b) => {
    return b.searchScore - a.searchScore;
  });

const groupedTemperedGroups =
  selectedPhone?.temperedGroups?.reduce((groups, item) => {
    const cleanModel = item.reference_model
      ?.replace(
        new RegExp(
          `^${selectedPhone?.brand}\\s*`,
          "i"
        ),
        ""
      );

    const existing = groups.find(
      (group) => group.reference_model === cleanModel
    );

    if (existing) {
      if (!existing.fits.includes(item.fit)) {
        existing.fits.push(item.fit);
      }
    } else {
      groups.push({
        reference_model: cleanModel,
        fits: [item.fit],
      });
    }

    return groups;
  }, []) || [];



/* LOADING SCREEN */

const loaderScreen = (
    <div className="mm-loader relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center">

      <style>{`
        .mm-loader {
          background: #f7f4ee;
          color: #4b2d1b;
        }
            /* TEMPERED GLASS SHINE */
  .glass-body {
    position: relative;
    overflow: hidden;
    isolation: isolate;
  }

  .glass-shine {
    position: absolute;
    top: -20%;
    left: -100%;
    width: 65%;
    height: 140%;
    z-index: 10;
    pointer-events: none;

    background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,0.4),
      rgba(255,255,255,1),
      rgba(255,255,255,0.4),
      transparent
    );

    filter: blur(2px);
    transform: skewX(-22deg);
    animation: glassSweep 3.5s linear infinite;
  }

  .glass-glow {
    position: absolute;
    inset: 0;
    z-index: 5;
    pointer-events: none;
    background: linear-gradient(
      110deg,
      transparent 20%,
      rgba(255,255,255,0.3) 50%,
      transparent 80%
    );
    animation: glassGlow 3s ease-in-out infinite alternate;
  }

  @keyframes glassSweep {
    0% {
      left: -100%;
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    100% {
      left: 150%;
      opacity: 0;
    }
  }

  @keyframes glassGlow {
    from {
      transform: translateX(-20%);
      opacity: 0.2;
    }
    to {
      transform: translateX(20%);
      opacity: 0.8;
    }
  }


}

        .mm-phone {
          animation: mmPhoneEnter 1s ease-out both;
      }

        .mm-powerbank {
          animation: mmPowerbankAttach 2s 0.8s cubic-bezier(.2,.8,.2,1) both;
        }

      .mm-powerbank-label {
  position: absolute;
  bottom: 70%;
  left: 50%;
  transform: translateX(50%);
  width: max-content;
  color: #4b2d1b;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
  opacity: 1;
  animation: powerbankLabel 2s 0.8s ease-in-out both;
  pointer-events: none;
}

@keyframes powerbankLabel {
  0%, 15% {
    opacity: 0;
  }
  30%, 65% {
    opacity: 1;
  }   
  100% {
    opacity: 1;
  }
}

        .mm-charge {
          animation: mmCharge 1s 2.5s ease-in-out infinite;
        }

        .mm-accessory {
          opacity: 0;
          animation: mmAccessoryEnter .8s ease-out forwards,
                     mmFloat 3s 4s ease-in-out infinite;
        }

        .mm-a1 { animation-delay: 3.2s, 4s; }
        .mm-a2 { animation-delay: 3.5s, 4.2s; }
        .mm-a3 { animation-delay: 3.8s, 4.4s; }
        .mm-a4 { animation-delay: 4.1s, 4.6s; }

        .mm-tagline {
          animation: mmTagline 1s 5s ease-out both;
        }

        @keyframes mmPhoneEnter {
          from { opacity: 0; transform: translateY(35px) scale(.85); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes mmPowerbankAttach {
  0% { opacity: 0; transform: translateX(200px) scale(.8); }
  55% { opacity: 1; transform: translateX(100px) scale(1); }
  100% { opacity: 1; transform: translateX(13px) scale(1); }
}

        @keyframes mmAccessoryEnter {
          from { opacity: 0; transform: translateY(100px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes mmFloat {
  0%, 100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -3px;
  }
}

        @keyframes mmCharge {
          0%, 100% { opacity: .45; }
          50% { opacity: 1; }
        }

        @keyframes mmTagline {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* FIX PHONE CHARGING SCREEN COLOURS */

.mm-pixel-lockscreen {
  color: #fff1d5 !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
}

.mm-pixel-ring {
  width: 65px !important;
  height: 65px !important;
  border: 2px solid #f3d49a !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #fff1d5 !important;
  box-shadow: 0 0 18px rgba(255, 210, 130, 0.8) !important;
  animation: pixelRingPulse 2s ease-in-out infinite;
}

.mm-pixel-ring span {
  color: #fff1d5 !important;
  font-size: 16px !important;
  font-weight: 700 !important;
}

.mm-lock-charging {
  color: #ffe6b5 !important;
  font-size: 9px !important;
  margin-top: 18px !important;
}

.mm-charging-dot {
  background: #ffe6a8 !important;
  box-shadow: 0 0 10px #ffd477 !important;
}

@keyframes pixelRingPulse {
  0%, 100% {
    box-shadow: 0 0 8px rgba(255, 210, 130, 0.4);
    transform: scale(0.95);
  }
  50% {
    box-shadow: 0 0 24px rgba(255, 210, 130, 1);
    transform: scale(1.08);
  }
}

       
        }
      `}
      
      </style>

      {/* BRAND */}
      <div className="absolute top-10 text-center">
        <h1 className="text-xl md:text-3xl font-bold tracking-[3px] md:tracking-[5px]"
            style={{ color: "#4b2d1b" }}>
          M.M TIMES & MOBILES
        </h1>
        <p className="text-[10px] md:text-xs tracking-[2px] md:tracking-[4px] mt-2 md:mt-3"
           style={{ color: "#b68a4a" }}>
          PREMIUM MOBILE ACCESSORIES
        </p>
      </div>

      {/* PHONE AND WIRELESS POWER BANK */}
<div className="relative flex items-center justify-center mt-[-80px] md:mt-[-70px] scale-[0.82] md:scale-100">
        
{/* Wireless power bank */}
<div className="mm-powerbank absolute z-0">
  <span className="mm-powerbank-label hidden md:block">
    WIRELESS POWERBANK

  </span>

  
  <div className="relative w-[112px] h-[205px] rounded-[25px]
    bg-gradient-to-br from-[#e0d8cc] via-[#bdb2a3] to-[#938879]
    border border-[#f4eee5] shadow-2xl
    flex flex-col items-center justify-center overflow-hidden">


    {/* Metallic highlight */}
    <div className="absolute inset-y-2 left-[3px] w-[2px]
      bg-white/40 rounded-full" />

    {/* Magnetic charging ring */}
    <div className="w-[70px] h-[70px] rounded-full
      border-[5px] border-[#f8f5ef]/90
      shadow-[0_0_8px_rgba(255,255,255,0.35)]
      flex items-center justify-center">

      <div className="w-[48px] h-[48px] rounded-full
        border border-white/40 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-[#eee7dc]/80" />
      </div>
    </div>

    {/* Vertical magnetic alignment mark */}
<div className="w-[5px] h-[28px] rounded-full
  bg-[#f8f5ef]/80 mt-3" />

    {/* Vertical kickstand line */}
<div className="absolute bottom-[17px] right-[30px]
  w-[2px] h-[30px]
  bg-[#817668]/70 rounded-full" />

    {/* Charging indicator lights */}
    <div className="absolute bottom-[8px] left-5 flex gap-[4px]">
      <span className="w-[4px] h-[4px] rounded-full bg-white/90" />
      <span className="w-[4px] h-[4px] rounded-full bg-white/70" />
      <span className="w-[4px] h-[4px] rounded-full bg-white/50" />
    </div>
  </div>
</div>


        {/* Smartphone */}
        <div className="mm-phone relative z-10">
          <div className="w-[125px] h-[245px] rounded-[30px] p-[5px] bg-gradient-to-br from-gray-700 to-black shadow-2xl border border-[#b68a4a]">
            <div className="w-full h-full rounded-[25px]
  bg-gradient-to-br from-[#263b49] to-[#101820]
  flex flex-col items-center justify-center
  relative overflow-hidden">

  {/* Phone speaker */}
  <div className="absolute top-3 w-10 h-1
    rounded-full bg-gray-500" />

  

{/* PIXEL-STYLE WIRELESS CHARGING SCREEN */}
<div className="mm-charge-screen mm-pixel-lockscreen">

  {/* Charging percentage */}
  <div className="mm-pixel-ring">
    <span>67%</span>
  </div>

  {/* Charging status */}
  <div className="mm-lock-charging">  
    Charging wirelessly
  </div>

{/* Energy particles */}
<div className="mm-energy-field">
  <span className="mm-particle mm-p1" />
  <span className="mm-particle mm-p2" />
  <span className="mm-particle mm-p3" />
  <span className="mm-particle mm-p4" />
  <span className="mm-particle mm-p5" />
  <span className="mm-particle mm-p6" />
  <span className="mm-particle mm-p7" />
  <span className="mm-particle mm-p8" />
  <span className="mm-particle mm-p9" />
  <span className="mm-particle mm-p10" />
  <span className="mm-particle mm-p11" />
  <span className="mm-particle mm-p12" />
</div>  

</div>

</div>

</div>
          
        </div>

    
      </div>
      

      {/* ACCESSORIES */}
      <div className="absolute bottom-28 md:bottom-32 w-full max-w-5xl px-1 md:px-5 grid grid-cols-4 items-center gap-2 md:gap-3 scale-[0.82] md:scale-100 origin-bottom">
<div className="mm-accessory mm-a1 flex flex-col items-center">
  {/* Premium navy-blue phone case */}
  <div className="relative w-12 h-24 md:w-16 md:h-32
    rounded-[17px] border border-[#8295b2]
    bg-gradient-to-br from-[#526b8d] via-[#344d70] to-[#263b59]
    shadow-xl overflow-hidden">


 
{/* Small dual-camera module */}
<div className="absolute top-[6px] left-[4px] md:top-[8px] md:left-[5px]
  w-[15px] h-[29px] md:w-[21px] md:h-[39px]
  rounded-full bg-[#cbd0d6]
  border border-[#8994a0]
  shadow-sm
  flex flex-col items-center justify-evenly">

  {/* Top lens */}
  <div className="w-[11px] h-[11px] md:w-[15px] md:h-[15px]
    rounded-full bg-[#aeb6bf] p-[2px]">
    <div className="w-full h-full rounded-full bg-[#080b10]
      border border-[#303945]" />
  </div>

  {/* Bottom lens */}
  <div className="w-[11px] h-[11px] md:w-[15px] md:h-[15px]
    rounded-full bg-[#aeb6bf] p-[2px]">
    <div className="w-full h-full rounded-full bg-[#080b10]
      border border-[#303945]" />
  </div>
</div>

{/* Small flash */}
<div className="absolute top-[17px] left-[21px]
  md:top-[23px] md:left-[28px]
  w-[4px] h-[4px] md:w-[6px] md:h-[6px]
  rounded-full bg-[#f5e8d0] border border-white" />



    {/* Soft case highlight */}
    <div className="absolute inset-y-2 left-[2px] w-[2px]
      rounded-full bg-white/10" />
  </div>

  <span className="text-[9px] md:text-xs tracking-wider mt-3">
    CASE
  </span>
</div>



{/* EARBUDS - OPEN CASE WITH FLOATING 3D EARBUDS */}
<div className="mm-accessory mm-a2 flex flex-col items-center">

  <div className="relative w-[100px] h-[112px] md:w-[120px] md:h-[130px]">

    {/* LEFT FLOATING EARBUD */}
    <div className="absolute top-[3px] left-[17px]
      md:left-[22px] w-[25px] h-[43px] md:w-[29px] md:h-[50px]
      rotate-[-12deg] z-20">

      {/* Silicone rubber tip */}
      <div className="absolute top-[9px] -right-[5px]
        w-[11px] h-[15px] rounded-full
        rotate-[-15deg]
        bg-gradient-to-br from-[#d9d4cc] via-[#aaa69f] to-[#77746f]
        border border-[#a9a39a] shadow-md z-20">

        <div className="absolute top-[4px] left-[3px]
          w-[4px] h-[6px] rounded-full
          bg-[#343638]" />
      </div>

      {/* Earbud head */}
      <div className="absolute top-0 left-0
        w-[24px] h-[25px] md:w-[28px] md:h-[29px]
        rounded-[48%] border border-[#e4dfd7]
        bg-gradient-to-br from-[#fffdf8] via-[#f3ede3] to-[#d8c9b5]
        shadow-md z-10">

        {/* Black speaker opening */}
        <div className="absolute top-[7px] left-[3px]
          w-[8px] h-[11px] rounded-full
          bg-[#25282b] border border-[#55575a]" />

        {/* Outer highlight */}
        <div className="absolute top-[4px] right-[5px]
          w-[5px] h-[5px] rounded-full bg-white/90" />
      </div>

      {/* Earbud stem */}
      <div className="absolute top-[18px] left-[9px]
        w-[11px] h-[30px] md:h-[35px]
        rounded-full border border-[#e1dcd4]
        bg-gradient-to-r from-[#fffdf8] via-[#eee5d8] to-[#d2c2ad]
        shadow-sm" />
    </div>

    {/* RIGHT FLOATING EARBUD */}
    <div className="absolute top-[8px] right-[13px]
      md:right-[17px] w-[26px] h-[44px] md:w-[30px] md:h-[51px]
      rotate-[12deg] z-20">

      {/* Silicone rubber tip */}
      <div className="absolute top-[9px] -left-[5px]
        w-[11px] h-[15px] rounded-full
        rotate-[15deg]
        bg-gradient-to-br from-[#d9d4cc] via-[#aaa69f] to-[#77746f]
        border border-[#a9a39a] shadow-md z-20">

        <div className="absolute top-[4px] right-[3px]
          w-[4px] h-[6px] rounded-full
          bg-[#343638]" />
      </div>

      {/* Earbud head */}
      <div className="absolute top-0 right-0
        w-[25px] h-[25px] md:w-[29px] md:h-[29px]
        rounded-[48%] border border-[#e4dfd7]
        bg-gradient-to-br from-[#fffdf8] via-[#f3ede3] to-[#d8c9b5]
        shadow-md z-10">

        {/* Black speaker opening */}
        <div className="absolute top-[7px] right-[3px]
          w-[8px] h-[11px] rounded-full
          bg-[#25282b] border border-[#55575a]" />

        {/* Outer highlight */}
        <div className="absolute top-[4px] left-[5px]
          w-[5px] h-[5px] rounded-full bg-white/90" />
      </div>

      {/* Earbud stem */}
      <div className="absolute top-[18px] right-[9px]
        w-[11px] h-[31px] md:h-[36px]
        rounded-full border border-[#e1dcd4]
        bg-gradient-to-r from-[#fffdf8] via-[#eee5d8] to-[#d2c2ad]
        shadow-sm" />
    </div>

    {/* OPEN CHARGING CASE LID */}
    <div className="absolute bottom-[39px] left-1/2
      -translate-x-1/2 w-[82px] h-[34px] md:w-[98px] md:h-[39px]
      rounded-t-[17px] rounded-b-[8px]
      border border-[#d8d0c5]
      bg-gradient-to-br from-[#fffdf8] to-[#e4d8c7]
      shadow-md z-10">

      <div className="absolute inset-[5px]
        rounded-t-[13px] rounded-b-[5px]
        border border-white/80
        bg-gradient-to-br from-[#e8e1d7] to-[#cfc5b8]" />

      <div className="absolute -bottom-[3px] left-1/2
        -translate-x-1/2 w-[43px] h-[5px]
        rounded-full bg-[#c9c0b5]" />
    </div>

    {/* CHARGING CASE BODY */}
    <div className="absolute bottom-[3px] left-1/2
      -translate-x-1/2 w-[88px] h-[47px] md:w-[106px] md:h-[53px]
      rounded-b-[25px] rounded-t-[9px]
      border border-[#d7d0c6]
      bg-gradient-to-br from-[#fffdf8] via-[#f1e9dd] to-[#d8c9b6]
      shadow-xl z-10">

      {/* Left charging well */}
      <div className="absolute top-[5px] left-[7px]
        w-[32px] h-[23px] md:w-[40px] md:h-[27px]
        rounded-full border border-[#e8e0d5]
        bg-gradient-to-br from-[#d8cfc3] to-[#eee9e1]
        shadow-inner" />

      {/* Right charging well */}
      <div className="absolute top-[5px] right-[7px]
        w-[32px] h-[23px] md:w-[40px] md:h-[27px]
        rounded-full border border-[#e8e0d5]
        bg-gradient-to-br from-[#d8cfc3] to-[#eee9e1]
        shadow-inner" />

      {/* Front highlight */}
      <div className="absolute bottom-[5px] left-1/2
        -translate-x-1/2 w-[55px] h-[2px]
        rounded-full bg-white/80" />

      {/* Charging LED */}
      <div className="absolute bottom-[8px] left-1/2
        -translate-x-1/2 w-[5px] h-[5px]
        rounded-full bg-[#c59648] shadow-sm" />
    </div>

  </div>

  <span className="text-[9px] md:text-xs tracking-wider mt-2">
    EARBUDS
  </span>
</div>


{/* TEMPERED GLASS */}
<div className="mm-accessory mm-a3 flex flex-col items-center">

  <div className="glass-body relative w-12 h-24 md:w-16 md:h-32
    rounded-2xl border border-white/90
    bg-gradient-to-br from-[#f8ffff] via-[#dce5e5] to-[#c5d4d5]
    shadow-[0_10px_22px_rgba(80,100,105,0.18)]
    overflow-hidden">

    {/* Moving reflection */}
    <div className="glass-shine" />

    {/* Soft inner reflection */}
    <div className="glass-glow" />

    {/* Static edge highlights */}
    <div className="absolute top-0 left-2 right-2
      h-[2px] bg-white/90 rounded-full z-20" />

    <div className="absolute right-[7px] top-3
      w-[2px] h-[65%] bg-white/70 rounded-full z-20" />

    <div className="absolute inset-0 rounded-2xl
      border border-white/40 pointer-events-none z-30" />

  </div>

  <span className="text-[9px] md:text-xs tracking-wider mt-3">
    TEMPERED GLASS
  </span>
</div>



{/* CHARGER */}
<div className="mm-accessory mm-a4 flex flex-col items-center">

  <div className="flex items-center gap-2">

    {/* Charger adapter */}
    <div className="relative mt-3">

      {/* Metallic pins */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2
        flex gap-3 z-10">
        <div className="w-[5px] h-5 rounded-t-full
          bg-gradient-to-r from-[#9d805b] via-[#fff0cf] to-[#a78350]
          border border-[#b68a4a] shadow-sm" />
        <div className="w-[5px] h-5 rounded-t-full
          bg-gradient-to-r from-[#9d805b] via-[#fff0cf] to-[#a78350]
          border border-[#b68a4a] shadow-sm" />
      </div>

      {/* Adapter body */}
      <div className="relative w-12 h-16 md:w-14 md:h-20
        rounded-[13px] border border-[#c9b18e]
        bg-gradient-to-br from-[#fffefa] via-[#f3eadc] to-[#d5c1a3]
        shadow-[inset_2px_2px_5px_rgba(255,255,255,0.9),inset_-3px_-3px_7px_rgba(150,120,80,0.15),0_9px_16px_rgba(90,65,35,0.22)]
        flex flex-col items-center justify-center overflow-hidden">

        {/* Front shine */}
        <div className="absolute top-2 left-[5px]
          w-[2px] h-[75%] rounded-full bg-white/80" />

        {/* Charging symbol only */}
        <svg viewBox="0 0 40 52"
  className="relative w-4 h-5 md:w-5 md:h-11"
  fill="none">
  <path
    d="M23 2 L8 28 H19 L15 50 L33 19 H21 Z"
    fill="#b68a4a"
    stroke="#a47b40"
    strokeWidth="1"
    strokeLinejoin="round"
  />
</svg>
      </div>
    </div>

   
{/* CLEAN USB-C TO USB-C COILED CABLE */}
<div className="relative w-12 h-16 md:w-14 md:h-20">

  <svg viewBox="0 0 64 80"
    className="w-full h-full overflow-visible">

    {/* Four clean cable loops */}
    <g fill="none"
      stroke="#cbb99e"
      strokeWidth="3.5"
      strokeLinecap="round">

      <ellipse cx="28" cy="40" rx="19" ry="29" />
      <ellipse cx="28" cy="40" rx="14" ry="23" />
      <ellipse cx="28" cy="40" rx="9" ry="17" />
      <ellipse cx="28" cy="40" rx="4" ry="12" />

    </g>

    {/* Top cable tail */}
    <path d="M28 11 C36 7 41 8 44 10"
      fill="none" stroke="#cbb99e"
      strokeWidth="3.5" strokeLinecap="round" />

    {/* Bottom cable tail */}
    <path d="M28 69 C36 73 41 72 44 70"
      fill="none" stroke="#cbb99e"
      strokeWidth="3.5" strokeLinecap="round" />

    

{/* TOP USB-C SILVER PIN */}
<g transform="translate(42 4) rotate(-12)">

  {/* Cable neck */}
  <rect x="0" y="2" width="12" height="7"
    rx="3" fill="#d7c3a3" stroke="#b99b72"/>

  {/* Silver rounded rectangular shell */}
  <rect x="9" y="2" width="11" height="7"
    rx="3" fill="#c8ced1"
    stroke="#858e92" strokeWidth="1"/>

  {/* Dark oval opening */}
  <rect x="12" y="3.2" width="6" height="3.6"
    rx="2.3" fill="#525c61"/>

  {/* Inner silver contact highlight */}
  <path d="M17 5.5 L13 5.5"
    stroke="#dce1e3" strokeWidth="0.7"
    strokeLinecap="round"/>
</g>

{/* BOTTOM USB-C SILVER PIN */}
<g transform="translate(42 69) rotate(12)">

  {/* Cable neck */}
  <rect x="0" y="-1" width="12" height="7"
    rx="3" fill="#d7c3a3" stroke="#b99b72"/>

  {/* Silver rounded rectangular shell */}
  <rect x="9" y="-1" width="11" height="7"
    rx="3" fill="#c8ced1"
    stroke="#858e92" strokeWidth="1"/>

  {/* Dark oval opening */}
  <rect x="12" y="1.1" width="6" height="3.6"
    rx="2.3" fill="#525c61"/>

  {/* Inner silver contact highlight */}
  <path d="M13 2.1 H17"
    stroke="#dce1e3" strokeWidth="0.7"
    strokeLinecap="round"/>
</g>


  </svg>
</div>



  </div>

  <span className="text-[9px] md:text-xs tracking-wider mt-3">
    CHARGER
  </span>
</div>

</div>
{/* FINAL QUOTE */}
<div className="absolute bottom-8 left-0 w-full flex justify-center px-4 z-20">
  <AnimatePresence>
    {showLoaderQuote && !startWordFlight &&  (
      <motion.p
  initial={{ opacity: 0, y: 0 }}
  animate={{ opacity: 1, y: 0 }}
  className="font-premium text-xl md:text-3xl tracking-wide text-center whitespace-nowrap"
  style={{ color: "#000000" }}
  exit={{ opacity: 0, y: 0 }}
  transition={{ duration: 1, ease: "easeInOut" }}
>
        <motion.span layoutId="word-everything" className="inline-block">
          Everything
        </motion.span>{" "}
        <motion.span layoutId="word-your" className="inline-block">
          Your
        </motion.span>{" "}
        <motion.span layoutId="word-phone" className="inline-block">
          Phone
        </motion.span>{" "}
        <motion.span
  layoutId="word-needs"
  className="inline-block"
  style={{ color: "#75472d" }}
>
  Needs
</motion.span>
      </motion.p>
    )}
  </AnimatePresence>
</div>
</div>


)

  return (
    <LayoutGroup>    
  <>
    {loading && (
      <motion.div
        className="fixed inset-0 z-[100]"
        animate={{
  opacity: startWordFlight ? 0 : 1,
}}
transition={{
  duration: startWordFlight ? 1.8 : 0.4,
  delay: 0,
}}
        style={{ pointerEvents: "none" }}
      >
        {loaderScreen}
      </motion.div>
    )}

<div className="min-h-screen bg-[#f7f4ee] text-[#171513] p-4 md:p-6 pt-[170px] md:pt-6 overflow-x-hidden">
      {/* PREMIUM NAVBAR */}
      
<header className="fixed top-0 left-0 right-0 z-40 bg-[#f7f4ee]/95 backdrop-blur-md border-b border-[#e7e0d5]">
<div className="max-w-7xl mx-auto px-5 md:px-8 h-auto md:h-[76px] py-3 md:py-0 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 md:gap-6">
    {/* BRAND */}
    <div className="shrink-0">
      <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#171513]">
        M.M TIMES
        <span className="font-normal ml-1">& MOBILES</span>
      </h1>

      <p className="hidden md:block text-[9px] tracking-[0.28em] uppercase text-[#716b63] mt-1">
        Premium Mobile Accessories
      </p>
    </div>

    {/* NAVIGATION */}
    <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#4d4842]">
      <button
        onClick={() => {
          setSelectedCategory(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="hover:text-[#6b4428] transition"
      >
        Home
      </button>

      <button
        onClick={() => {
          document
            .getElementById("shop-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
        className="hover:text-[#6b4428] transition"
      >
        Shop
      </button>

      <button
        onClick={() => {
          document
            .getElementById("compatibility-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
        className="hover:text-[#6b4428] transition"
      >
        Phone Compatibility
      </button>

      <button
        className="hover:text-[#6b4428] transition"
      >
        Track Order
      </button>
    </nav>

    {/* ACTIONS */}
    <div className="w-full md:w-auto flex items-center gap-3 md:gap-5">
<div className="relative flex-1 min-w-0 md:flex-none flex items-center bg-white border border-[#e7e0d5] rounded-full px-4 py-2.5 md:w-52 xl:w-80 gap-2">
  <span className="text-[#716b63] text-sm">⌕</span>

  <input
    type="text"
    placeholder="Search products..."
    value={productSearch}
    onFocus={() => setShowSearchSuggestions(true)}
    onChange={(e) => {
      setProductSearch(e.target.value);
      setSelectedCategory(null);
      setShowSearchSuggestions(true);
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter" && productSearch.trim()) {
        setShowSearchSuggestions(false);
        document
          .getElementById("product-search-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (e.key === "Escape") {
        setShowSearchSuggestions(false);
      }
    }}
    className="min-w-0 flex-1 bg-transparent outline-none text-sm text-[#171513] placeholder:text-[#9a948c]"
  />

  <button
    type="button"
    onClick={() => {
      if (!productSearch.trim()) return;
      setSelectedCategory(null);
      setShowSearchSuggestions(false);
      document
        .getElementById("product-search-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }}
    className="rounded-full bg-[#6b4428] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4b2d1b] transition"
  >
    Search
  </button>

  {showSearchSuggestions && productSearch.trim().length > 0 && (
    <div className="absolute left-0 right-0 top-full mt-3 bg-white border border-[#e7e0d5] rounded-2xl shadow-xl overflow-hidden z-50">
      {products
        .filter((product) => {
          const query = productSearch.trim().toLowerCase();

          return (
            product.product_name?.toLowerCase().includes(query) ||
            product.brand?.toLowerCase().includes(query) ||
            product.category?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query)
          );
        })
        .slice(0, 5)
        .map((product) => (
          <button
            type="button"
            key={product.id}
            onClick={() => {
              setProductSearch(product.product_name);
              setSelectedCategory(null);
              setShowSearchSuggestions(false);

              document
                .getElementById("product-search-results")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="w-full flex items-center gap-3 p-3 text-left border-b border-[#f0e9df] last:border-b-0 hover:bg-[#faf7f2] transition"
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt=""
                className="w-12 h-12 rounded-lg object-contain bg-[#f7f4ee] shrink-0"
              />
            ) : (
              <span className="w-12 h-12 rounded-lg bg-[#f7f4ee] flex items-center justify-center shrink-0">
                📦
              </span>
            )}

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[#171513] truncate">
                {product.product_name}
              </span>
              <span className="block text-xs text-[#9a948c] mt-1">
                {product.brand || product.category}
              </span>
            </span>

            <span className="text-xs font-semibold text-[#6b4428]">
              ₹{product.sale_price || product.price}
            </span>
          </button>
        ))}

      {!products.some((product) => {
        const query = productSearch.trim().toLowerCase();

        return (
          product.product_name?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
        );
      }) && (
        <p className="p-4 text-sm text-[#716b63]">
          No matching products found.
        </p>
      )}
    </div>
  )}
</div>


      <button className="text-[#171513] text-xl hover:text-[#6b4428] transition">
        ♡
      </button>

      

<button
  type="button"
  onClick={() => setShowCartDrawer(true)}
  aria-label="Open shopping cart"
  className="relative text-[#171513] text-xl hover:text-[#6b4428] transition"
>
  🛒

  {cart.length > 0 && (
    <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-[#6b4428] text-white text-[10px] flex items-center justify-center font-bold">
      {cart.reduce(
        (total, item) => total + item.quantity,
        0
      )}
    </span>
  )}
</button>

    </div>

  </div>
  {/* SLIDING CATEGORY MENU */}
<div className="w-full overflow-x-auto overflow-y-hidden scrollbar-hide border-t border-[#e7e0d5] scroll-smooth touch-pan-x">
  <div className="flex w-max min-w-full items-center gap-12 px-5 py-4">
    {[
      "Tempered Glass",
      "Back Cases",
      "Chargers",
      "Cables",
      "Earphones",
      "Other Accessories",
    ].map((category) => (
      <button
        key={category}
        onClick={() => {
          setProductSearch("");
          setSelectedCategory(category);
          document
            .getElementById("product-search-results")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
        className="shrink-0 text-sm md:text-base font-semibold text-[#4d4842] hover:text-[#6b4428] transition"
      >
        {category}
      </button>
    ))}
  </div>
</div>
</header>


  {/* PREMIUM HERO */}
  <section className="max-w-7xl mx-auto px-5 md:px-8 pt-4 md:pt-4 pb-12 bg-[#f7f4ee] rounded-[32px]">
</section>
<section className="max-w-7xl mx-auto px-5 md:px-8 pt-10 md:pt-28 pb-12 bg-[#f7f4ee] rounded-[32px]">
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

      {/* HERO COPY */}

      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-2xl"
      >

        <p className="text-[#9a7442] text-xs md:text-sm font-semibold tracking-[0.35em] uppercase mb-5">
          Premium Mobile Accessories
        </p>

      <motion.h2
  className="font-premium text-4xl md:text-6xl xl:text-7xl leading-[0.95] text-[#171513]"
  initial={false}
  animate={{ opacity: startWordFlight ? 1 : 0 }}
  transition={{ duration: 0.3 }}
>
    <motion.span
    layoutId="word-everything"
      className="inline-block"
    transition={{ layout: { duration: 1.6, ease: [0.22, 1, 0.36, 1] } }}
    >
      <motion.span
    animate={{
      scale: startWordFlight ? [1, 1.4, 1] : 1
    }}
    transition={{
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
    }}
  >
    Everything
  </motion.span>
    </motion.span>
    <br />

    <motion.span
    layoutId="word-your"
      className="inline-block"
      transition={{ layout: { duration: 1.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] } }}
    >
      <motion.span
    animate={{
      scale: startWordFlight ? [1, 1.4, 1] : 1
    }}
    transition={{
      duration: 1.4,
      delay: 0.15,
      ease: [0.22, 1, 0.36, 1],
    }}
  >
    Your
  </motion.span>
    </motion.span>{" "}

    <motion.span
    layoutId="word-phone"
      className="inline-block"
      transition={{ layout: { duration: 1.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] } }}
    >
      <motion.span
    animate={{
      scale: startWordFlight ? [1, 1.4, 1] : 1
    }}
    transition={{
      duration: 1.4,
      delay: 0.3,
      ease: [0.22, 1, 0.36, 1],
    }}
  >
    Phone
  </motion.span>
    </motion.span>{" "}

    <motion.span
    layoutId="word-needs"
      className="inline-block"
      transition={{ layout: { duration: 1.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      style={{ color: "#75472d" }}
    >
      <motion.span
    animate={{
      scale: startWordFlight ? [1, 1.4, 1] : 1
    }}
    transition={{
      duration: 1.4,
      delay: 0.45,
      ease: [0.22, 1, 0.36, 1],
    }}
  >
    Needs.
  </motion.span>
    </motion.span>
  </motion.h2>

        <p className="text-[#716b63] text-base md:text-lg mt-7 max-w-xl leading-relaxed">
          Protection, power and style for every device.
          Find premium accessories and the perfect fit for your phone.
        </p>

        <div className="flex flex-wrap gap-3 mt-8">

          <button
          onClick={() => {
            document
              .getElementById("shop-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className="px-7 py-3.5 rounded-xl bg-[#171513] text-white font-semibold hover:bg-[#4b2d1b] transition"
        >
          Shop Accessories →
        </button>

        <button
          onClick={() => {
            setSearchMode("phones");
            setSearch("");
            setSubmitted(false);

            setTimeout(() => {
              document
                .getElementById("compatibility-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }, 50);
          }}
          className="px-7 py-3.5 rounded-xl border border-[#cdbda8] bg-white text-[#171513] font-semibold hover:border-[#6b4428] transition"
        >
          ⌕ Find Compatibility
        </button>

      </div>

      {/* TRUST POINTS */}

<div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10 pt-7 border-t border-[#e7e0d5] text-[#171513]">
        <div>
          <p className="text-lg">◇</p>
          <p className="text-xs font-semibold mt-2">Genuine Products</p>
        </div>

        <div>
          <p className="text-lg">⌂</p>
          <p className="text-xs font-semibold mt-2">Easy Pickup</p>
        </div>

        <div>
          <p className="text-lg">✧</p>
          <p className="text-xs font-semibold mt-2">Wide Compatibility</p>
        </div>

        <div>
          <p className="text-lg">♧</p>
          <p className="text-xs font-semibold mt-2">Trusted Store</p>
        </div>

      </div>

    </motion.div>


    
{/* HERO PRODUCT VISUAL */}

{(() => {
  
const currentSlide =
  heroSlides.length > 0
    ? heroSlides[heroIndex % heroSlides.length]
    : null;


  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.15 }}
 className="relative h-[280px] md:h-auto min-h-[340px] md:min-h-[440px] rounded-[32px] overflow-hidden bg-[#e9dfd1]" >
      <div className="absolute inset-0 bg-gradient-to-br from-[#eee4d7] via-[#d8c5ad] to-[#7a5436]" />

      <div className="absolute top-10 right-8 w-40 h-40 rounded-full bg-[#ffffff55] blur-3xl" />

      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#4b2d1b55] to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center p-8 pb-24">
        {currentSlide ? (
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 1.2, ease: "easeInOut" }}
            className="relative z-10 flex h-full w-full items-center justify-center"
          >
            
<img
  src={currentSlide.image_url}
  alt={currentSlide.title || "M.M TIMES hero slide"} 

className="h-full w-full object-cover rounded-[28px]"


/>
          </motion.div>
        ) : (
          <div className="relative z-10 flex h-64 w-56 items-center justify-center rounded-[28px] border border-white/70 bg-white/80 text-7xl shadow-2xl">
            📱
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-20 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/80">
            M.M TIMES
          </p>
          <p className="font-premium mt-1 text-xl text-white md:text-2xl">
            Protect. Power. Personalize.
          </p>
        </div>

      </div>
    </motion.div>
  );
})()}


  </div>

</section>

{/* SHOP ACCESSORIES */}

{(search.length === 0 || search.trim().length > 0) && (
  <section
    id="shop-section"
    className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-20"
  >
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-10"
    >
      <p className="text-[#9a7442] text-xs md:text-sm font-semibold tracking-[0.3em] uppercase mb-3">
        Shop Collection
      </p>

      <h2 className="font-premium text-4xl md:text-5xl text-[#171513]">
        Shop Accessories
      </h2>

      <p className="text-[#716b63] text-base md:text-lg mt-3">
        Everything your phone needs, all in one place.
      </p>
    </motion.div>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
      {[
        ["🛡️", "Tempered Glass"],
        ["📱", "Back Cases"],
        ["🔌", "Chargers"],
        ["⚡", "Cables"],
        ["🎧", "Earphones"],
        ["🧩", "Other Accessories"],
      ].map(([icon, category]) => (
        <motion.div
          key={category}
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedCategory(category)}
          className="group cursor-pointer bg-white border border-[#e7e0d5] rounded-2xl p-5 md:p-6 text-center shadow-[0_8px_30px_rgba(75,45,27,0.05)] hover:border-[#b68a4a] hover:shadow-[0_16px_35px_rgba(75,45,27,0.12)] transition-all duration-300"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full bg-[#f3ede4] flex items-center justify-center text-3xl md:text-4xl group-hover:bg-[#eadccc] transition">
            {icon}
          </div>

          <h3 className="text-sm md:text-base font-semibold text-[#171513] group-hover:text-[#6b4428] transition">
            {category}
          </h3>

          <p className="text-xs text-[#9a948c] mt-1">
            Explore →
          </p>
        </motion.div>
      ))}
    </div>
  </section>
)}
{(selectedCategory || productSearch.trim()) && (
  <div id="product-search-results" className="mt-10"> 
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-2xl md:text-3xl font-bold">
          {selectedCategory
            ? selectedCategory === "Tempered Glass"
              ? "🛡️ Temper Available"
              : selectedCategory
            : `Search Results for "${productSearch.trim()}"`}
        </h3>

        <p className="text-gray-400 mt-1">
          Available products at M.M TIMES
        </p>
      </div>

      <button
        onClick={() => {
          setSelectedCategory(null);
          setProductSearch("");
        }}
        className="px-4 py-2 rounded-xl border border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-400 transition"
      >
        ✕ Clear
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

      {products.filter((product) => {
  const query = productSearch.trim().toLowerCase();

  const matchesCategory =
    !selectedCategory ||
    product.category?.toLowerCase() ===
      selectedCategory.toLowerCase();

  const matchesSearch =
    !query ||
    product.product_name?.toLowerCase().includes(query) ||
    product.brand?.toLowerCase().includes(query) ||
    product.category?.toLowerCase().includes(query) ||
    product.description?.toLowerCase().includes(query);

  return matchesCategory && matchesSearch;
}).length === 0 ? (
  <p className="col-span-full py-10 text-center text-[#716b63]">
    No products found for "{productSearch.trim()}". Try another search.
  </p>
) :(
  products
    .filter((product) => {
    const query = productSearch.trim().toLowerCase();

    const matchesCategory =
      !selectedCategory ||
      product.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !query ||
      product.product_name?.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  })
  .map((product) => (
    <div
      key={product.id}
      className="bg-white border border-[#e7e0d5] rounded-2xl p-5 shadow-[0_10px_30px_rgba(75,45,27,0.06)] overflow-hidden"
    >

            <div className="w-full h-40 rounded-2xl bg-black flex items-center justify-center mb-5">

              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className="max-h-36 max-w-full object-contain"
                />
              ) : (
                <div className="text-6xl">
                  {selectedCategory === "Tempered Glass"
                    ? "🛡️"
                    : selectedCategory === "Back Cases"
                    ? "📱"
                    : selectedCategory === "Chargers"
                    ? "🔌"
                    : selectedCategory === "Cables"
                    ? "⚡"
                    : selectedCategory === "Earphones"
                    ? "🎧"
                    : "🧩"}
                </div>
              )}

            </div>

            <h4 className="text-xl font-bold text-[#171513] break-words">
            {product.product_name}
            </h4>

            {product.brand && (
              <p className="text-gray-500 text-sm mt-1">
                {product.brand}
              </p>
            )}

            <div className="mt-4">
              {product.sale_price ? (
                <>
                  <span className="text-gray-500 line-through mr-2">
                    ₹{product.price}
                  </span>

                  <span className="text-green-400 text-xl font-bold">
                    ₹{product.sale_price}
                  </span>
                </>
              ) : (
                <span className="text-green-400 text-xl font-bold">
                  ₹{product.price}
                </span>
              )}
            </div>

            <p className="text-gray-400 text-sm mt-3">
              {product.stock > 0
                ? `In Stock • ${product.stock} available`
                : "Out of Stock"}
            </p>

            <button
  onClick={() => setSelectedProduct(product)}
  className="w-full mt-3 py-3 rounded-2xl border border-[#805735] text-[#805735] font-semibold hover:bg-[#f5eee6] transition"
>
  View Product Details
</button>
            {product.stock > 0 && (
  
<button
  onClick={() => {
    const existing = cart.find(
      (item) => item.id === product.id
    );

    const currentQuantity = existing ? existing.quantity : 0;

   
if (currentQuantity >= product.stock) {
  setStockLimitMessage(
    `Sorry! Only ${product.stock} units of ${product.product_name} are available.`
  );

  window.setTimeout(() => {
    setStockLimitMessage("");
  }, 3000);

  return;
}


    setCart((currentCart) => {
      const itemInCart = currentCart.find(
        (item) => item.id === product.id
      );

      if (itemInCart) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    setAddedProductId(product.id);

    window.setTimeout(() => {
      setAddedProductId((current) =>
        current === product.id ? null : current
      );
    }, 1600);
  }}
  className={`relative z-20 w-full mt-4 py-3 rounded-2xl font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-md ${
    addedProductId === product.id
      ? "bg-green-600 text-white scale-[1.02]"
      : "bg-[#805735] text-white hover:bg-[#6b4428] hover:scale-[1.02]"
  }`}
>
  {addedProductId === product.id
    ? "✓ Added to Cart!"
    : "🛒 Add to Cart"}
</button>

  )}

            </div>

          )))}

      </div>

    </div>
        )}

        
{stockLimitMessage && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-sm rounded-3xl bg-[#F5EFE6] p-6 text-center shadow-2xl">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8D8C5] text-3xl">
        ⚠️
      </div>

      <h2 className="mb-2 text-xl font-bold text-[#4B3322]">
        Stock Limit Reached
      </h2>

      <p className="mb-6 text-[#705B49]">
        {stockLimitMessage}
      </p>

      <button
        onClick={() => setStockLimitMessage("")}
        className="w-full rounded-xl bg-[#805735] px-5 py-3 font-bold text-white transition hover:bg-[#6b4428]"
      >
        Got it
      </button>
    </div>
  </div>
)}
{/* PRODUCT DETAILS POPUP */}
{selectedProduct && (
  <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4">
    <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-[#F7F4EE] p-6 shadow-2xl">

      <button
        onClick={() => setSelectedProduct(null)}
        className="absolute right-4 top-4 text-2xl text-[#6b4428]"
      >
        ×
      </button>

      {selectedProduct.image_url && (
        <img
          src={selectedProduct.image_url}
          alt={selectedProduct.product_name}
          className="w-full h-56 object-contain rounded-2xl bg-white mb-5"
        />
      )}

      <h2 className="text-2xl font-bold text-[#4b2d1b]">
        {selectedProduct.product_name}
      </h2>

      <p className="text-sm text-[#9a7442] mt-2">
        {selectedProduct.brand}
      </p>

      <p className="text-[#5f554b] mt-4 leading-relaxed">
        {selectedProduct.description || "Product description coming soon."}
      </p>

      <p className="text-xl font-bold text-[#6b4428] mt-5">
        ₹{selectedProduct.sale_price || selectedProduct.price}
      </p>

      <p className="text-sm text-[#716b63] mt-2">
        {selectedProduct.stock > 0
          ? `In Stock • ${selectedProduct.stock} available`
          : "Out of Stock"}
      </p>

      <div className="flex gap-3 mt-6">
  <button
    onClick={() => setSelectedProduct(null)}
    className="flex-1 rounded-xl border border-[#805735] py-3 font-bold text-[#805735]"
  >
    Close
  </button>

  <button
    disabled={selectedProduct.stock <= 0}
    onClick={() => {
      const product = selectedProduct;
      const existing = cart.find(
        (item) => item.id === product.id
      );

      if (existing && existing.quantity >= product.stock) {
        setStockLimitMessage(
          `Sorry! Only ${product.stock} units are available.`
        );
        return;
      }

      setCart((currentCart) => {
        const item = currentCart.find(
          (item) => item.id === product.id
        );

        if (item) {
          return currentCart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }

        return [...currentCart, { ...product, quantity: 1 }];
      });

      setAddedProductId(product.id);
setSelectedProduct(null);

window.setTimeout(() => {
  setAddedProductId((current) =>
    current === product.id ? null : current
  );
}, 1600);
    }}
    className="flex-1 rounded-xl bg-[#805735] py-3 font-bold text-white disabled:opacity-40"
  >
    {addedProductId === selectedProduct.id
  ? "✓ Added to Cart!"
  : "🛒 Add to Cart"}
  </button>
</div>

    </div>
  </div>
)}

      {/* PHONE COMPATIBILITY */}

<section
  id="compatibility-section"
  className="max-w-4xl mx-auto px-5 md:px-8 py-14 md:py-20"
>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center mb-8"
  >
    <p className="text-[#9a7442] text-xs md:text-sm font-semibold tracking-[0.3em] uppercase mb-3">
      Find Your Fit
    </p>

    <h2 className="font-premium text-4xl md:text-5xl text-[#171513]">
      Phone Compatibility
    </h2>

    <p className="text-[#716b63] text-base md:text-lg mt-3">
      Find the perfect tempered glass for your phone.
    </p>
  </motion.div>

  {/* SEARCH MODE */}

  <div className="flex justify-center gap-3 mb-5 flex-wrap">
    <button
      onClick={() => {
        setSearchMode("phones");
        setSearch("");
        setSubmitted(false);
      }}
      className={`px-6 py-3 rounded-full font-semibold text-sm md:text-base transition-all ${
        searchMode === "phones"
          ? "bg-[#8f5f3a] text-white shadow-md"
          : "bg-white text-[#716b63] border border-[#e7e0d5] hover:border-[#b68a4a] hover:text-[#6b4428]"
      }`}
    >
      📱 Phones
    </button>

    <button
      onClick={() => {
        setSearchMode("tempers");
        setSearch("");
        setSubmitted(false);
      }}
      className={`px-6 py-3 rounded-full font-semibold text-sm md:text-base transition-all ${
        searchMode === "tempers"
          ? "bg-[#6b4428] text-white shadow-md"
          : "bg-white text-[#716b63] border border-[#e7e0d5] hover:border-[#b68a4a] hover:text-[#6b4428]"
      }`}
    >
      🛡️ Tempered Glass
    </button>
  </div>

  {/* SEARCH INPUT */}

  <div className="relative">
    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9a948c] text-lg">
      ⌕
    </span>

    <input
      type="text"
      placeholder={
        searchMode === "phones"
          ? "Search phones, brands, models..."
          : "Search tempered glass models..."
      }
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setSubmitted(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setSubmitted(true);
        }
      }}
      className="w-full pl-12 pr-5 py-4 md:py-5 rounded-2xl bg-white border border-[#e7e0d5] text-[#171513] placeholder:text-[#9a948c] outline-none shadow-[0_8px_25px_rgba(75,45,27,0.06)] focus:border-[#b68a4a] focus:ring-2 focus:ring-[#b68a4a]/10 transition"
    />
  </div>
</section>

      {/* AUTOCOMPLETE */}

{search.length > 0 &&
  !submitted &&
  (
    searchMode === "phones"
      ? filteredPhones.length > 1
      : filteredTempers.length > 1
  ) && (
    <div className="max-w-xl mx-auto mb-6 bg-white border border-[#e7e0d5] rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(75,45,27,0.08)]">

  {searchMode === "phones" ? (
    [
      ...new Map(
        filteredPhones.map((phone) => [
          phone.model,
          phone,
        ])
      ).values(),
    ]
      .slice(0, 5)
      .map((phone) => (
        <div
          key={phone.id}
          onClick={() => {
            setSearch(phone.model);
            setSubmitted(true);
          }}
          className="px-5 py-4 cursor-pointer border-b border-[#e7e0d5] last:border-b-0 hover:bg-[#faf7f2] transition-all duration-200"
        >
          <p className="font-semibold text-[#6b4428] text-base">
            {phone.model}
          </p>

          <p className="text-[#9a948c] text-sm mt-1">
            {phone.brand}
          </p>
        </div>
      ))
  ) : (
    filteredTempers
      .slice(0, 5)
      .map((temper) => (
        <div
          key={temper.group_id}
          onClick={() => {
            setSearch(temper.reference_model);
            setSubmitted(true);
          }}
          className="px-5 py-4 cursor-pointer border-b border-[#e7e0d5] last:border-b-0 hover:bg-[#faf7f2] transition-all duration-200"
        >

<p className="font-semibold text-[#b68a4a] text-base flex items-center gap-2">
            🛡️
            {(() => {
              const words = temper.reference_model
                .trim()
                .split(/\s+/);

              if (
                words.length >= 2 &&
                words[0].toLowerCase() ===
                  words[1].toLowerCase()
              ) {
                return words.slice(1).join(" ");
              }

              return temper.reference_model;
            })()}
          </p>

          <p className="text-[#9a948c] text-sm mt-1">
            {temper.compatiblePhones.length} compatible phones
          </p>

        </div>
      ))
  )}

</div>
  )
}

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-7xl mx-auto mb-16 px-5 md:px-8">

  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white border border-[#e7e0d5] rounded-2xl p-7 text-center shadow-[0_8px_30px_rgba(75,45,27,0.05)]"
  >
    <h2 className="font-premium text-4xl md:text-5xl text-[#6b4428]">
      {phones.length}+
    </h2>

    <p className="text-[#716b63] mt-2">
      Supported Phone Models
    </p>
  </motion.div>

  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white border border-[#e7e0d5] rounded-2xl p-7 text-center shadow-[0_8px_30px_rgba(75,45,27,0.05)]"
  >
    <h2 className="font-premium text-4xl md:text-5xl text-[#6b4428]">
      {brands.length}
    </h2>

    <p className="text-[#716b63] mt-2">
      Supported Brands
    </p>
  </motion.div>

  <motion.div
    whileHover={{ y: -4 }}
    className="bg-[#6b4428] rounded-2xl p-7 text-center shadow-[0_12px_35px_rgba(75,45,27,0.15)]"
  >
    <h2 className="font-premium text-4xl md:text-5xl text-white">
      LIVE
    </h2>

    <p className="text-white/75 mt-2">
      Real-Time Database
    </p>
  </motion.div>

</div>

      {/* BRAND BOXES */}

{search.length === 0 && (
  <section className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-16">
    
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-10"
    >
      <p className="text-[#9a7442] text-xs md:text-sm font-semibold tracking-[0.3em] uppercase mb-3">
        Top Brands
      </p>

      <h2 className="font-premium text-4xl md:text-5xl text-[#171513]">
        Shop by Brand
      </h2>

      <p className="text-[#716b63] text-base md:text-lg mt-3">
        Find accessories for your favourite phone brand.
      </p>
    </motion.div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
      {brands.map((brand) => (
        <motion.div
          key={brand}
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setSearch(brand);
            setSubmitted(true);
          }}
          className="group cursor-pointer bg-white border border-[#e7e0d5] rounded-2xl p-6 text-center shadow-[0_8px_30px_rgba(75,45,27,0.05)] hover:border-[#b68a4a] hover:shadow-[0_16px_35px_rgba(75,45,27,0.12)] transition-all duration-300"
        >
          <div className="h-20 flex items-center justify-center mb-5">
            <img
              src={brandIcons[brand]}
              alt={brand}
              className="max-h-16 max-w-28 object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <h2 className="text-lg md:text-xl font-semibold text-[#171513] group-hover:text-[#6b4428] transition">
            {brand}
          </h2>

          <p className="text-sm text-[#9a948c] mt-2">
            Explore Models →
          </p>
        </motion.div>
      ))}
    </div>

  </section>
)}


      {/* RESULTS */}

<div className="grid gap-6 max-w-6xl mx-auto">

  {searchMode === "phones" ? (

    /* =====================================
       PHONE SEARCH RESULTS
       ===================================== */

    hasResults ? (

      filteredPhones.slice(0, 10).map((phone) => (

        <motion.div
          key={phone.id}

          initial={{
            opacity: 0,
            y: 40,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            duration: 0.4,
          }}

          onClick={() => {
  const fullPhone = phones.find(
    (p) => p.id === phone.id
  );
  setSelectedPhone(fullPhone || phone);
}}
className="group bg-white p-5 md:p-7 rounded-3xl border border-[#e7e0d5] shadow-[0_10px_35px_rgba(75,45,27,0.06)] hover:border-[#b68a4a] hover:shadow-[0_18px_45px_rgba(75,45,27,0.12)] transition-all duration-300 cursor-pointer"
>

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">

            {/* PHONE IMAGE */}

<div className="w-full md:w-36 h-36 md:h-44 flex items-center justify-center shrink-0">
              {phone.image_url ? (

                <img
                  src={phone.image_url}
                  alt={phone.model}
className="max-h-40 max-w-32 object-contain drop-shadow-[0_12px_18px_rgba(75,45,27,0.12)] group-hover:scale-105 transition-transform duration-300"
                  />

              ) : (

                <div className="text-6xl opacity-40">
                  📱
                </div>

              )}

            </div>


            {/* PHONE INFORMATION */}

            <div className="flex-1 w-full text-center md:text-left">

              {/* MODEL */}

<h2 className="font-premium text-2xl md:text-3xl text-[#171513] mb-2 group-hover:text-[#6b4428] transition">
                {phone.model}

              </h2>


              {/* BRAND */}

<p className="text-[#716b63] mb-5">
                <span className="text-[#9a948c]">
                  Brand:
                </span>{" "}

                <span className="text-[#171513] font-semibold">
                  {phone.brand}
                </span>

              </p>


              {/* COMPATIBLE TEMPER */}

              <div className="mb-4">

                <p className="text-gray-500 text-sm mb-1">
                  Compatible Temper
                </p>

                {phone.temperedGroups &&
                phone.temperedGroups.length > 0 ? (

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">

                    {[
                      ...new Map(
                        phone.temperedGroups.map((item) => {

                          const cleanModel =
                            item.reference_model.replace(
                              new RegExp(
                                `^(${phone.brand})\\s+\\1\\s+`,
                                "i"
                              ),
                              "$1 "
                            );

                          return [
                            cleanModel,
                            cleanModel,
                          ];

                        })
                      ).values(),

                    ].map((model, index) => (

                      <button
  key={`${model}-${index}`}
  onClick={(e) => {
    e.stopPropagation();
    setSearchMode("tempers");
    setSearch(model);
    setSubmitted(true);
  }}
  className="px-3 py-1.5 rounded-full bg-[#f3ede4] border border-[#d8c5ad] text-[#6b4428] font-semibold text-sm hover:bg-[#6b4428] hover:text-white transition-all cursor-pointer"
>
  {highlightModel(model, search)}
</button>

                    ))}

                  </div>

                ) : (

                  <span className="text-[#9a948c]">
                    No compatible temper found
                  </span>

                )}

              </div>


              {/* FIT */}

              <div>

                <p className="text-gray-500 text-sm mb-1">
                  Fit Quality
                </p>

                {phone.temperedGroups &&
                phone.temperedGroups.length > 0 ? (

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">

                    {[
                      ...new Set(
                        phone.temperedGroups.map(
                          (item) => item.fit
                        )
                      ),

                    ].map((fit, index) => (

                      <span
                        key={`${fit}-${index}`}
                        className="px-3 py-1.5 rounded-full bg-[#f7f1e8] border border-[#d8c5ad] text-[#9a7442] font-bold text-sm"
                      >

                        {fit}

                      </span>

                    ))}

                  </div>

                ) : (

                  <span className="text-[#9a948c]">
                    —
                  </span>

                )}

              </div>

            </div>


            {/* VIEW DETAILS */}

            <div className="shrink-0">

              <div
              className="px-5 py-3 rounded-2xl border border-[#cdbda8] text-[#6b4428] font-semibold group-hover:bg-[#171513] group-hover:text-white transition-all"           
               >

                View Details →

              </div>

            </div>

          </div>

        </motion.div>

      ))

    ) : (

      <div className="text-center mt-20">

        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          😭 No Models Found
        </h2>

        <p className="text-gray-400 text-xl">
          Bro searched a secret phone 💀
        </p>

      </div>

    )

  ) : (

    /* =====================================
       TEMPER GLASS SEARCH RESULTS
       ===================================== */

      filteredTempers.length > 0 ? (

        filteredTempers
          .slice(0, 10)
          .map((temper) => (

            <motion.div
              key={temper.group_id}
              

              initial={{
                opacity: 0,
                y: 40,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              transition={{
                duration: 0.4,
              }}
              onClick={() => {
    setExpandedTemper(
      expandedTemper === temper.group_id
        ? null
        : temper.group_id
    );  
  }}

  
  className="group bg-white p-5 md:p-8 rounded-3xl border border-[#e7e0d5] shadow-[0_10px_35px_rgba(75,45,27,0.06)] hover:border-[#b68a4a] hover:shadow-[0_18px_45px_rgba(75,45,27,0.12)] transition-all duration-300"
>

              {/* TEMPER MODEL */}

  <div className="flex flex-col md:flex-row gap-4 md:gap-6">  
                <div className="w-full md:w-32 h-32 flex items-center justify-center shrink-0">

                <div className="w-24 h-24 rounded-full bg-[#f3ede4] flex items-center justify-center text-5xl">
    🛡️
  </div>

                </div>


                <div className="flex-1">

                <p className="text-[#9a948c] text-sm mb-1">
                  Temper Glass Model
                </p>

                <h2 className="font-premium text-2xl md:text-3xl text-[#171513] mb-5">

                  {(() => {
  const words = temper.reference_model
    .trim()
    .split(/\s+/);

  if (
    words.length >= 2 &&
    words[0].toLowerCase() ===
      words[1].toLowerCase()
  ) {
    return words.slice(1).join(" ");
  }

  return temper.reference_model;
})()}

                </h2>


                {/* FIT */}

                <div className="mb-5">

                  <p className="text-[#9a948c] text-sm mb-2">
                    Fit Quality
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {[...new Set(temper.fits)].map(
                      (fit, index) => (

                        <span
                          key={`${fit}-${index}`}
  className="px-3 py-1.5 rounded-full bg-[#f7f1e8] border border-[#d8c5ad] text-[#9a7442] font-bold text-sm"                      >
                          {fit}
                        </span>

                      )
                    )}

                  </div>

                </div>


                {/* COMPATIBLE PHONES */}

                <div>

                  <p className="text-[#9a948c] text-sm mb-2">
                    Compatible Phones
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {[...temper.compatiblePhones]
  .sort((a, b) => {
    const query = normalizeSearch(search);

    const aModel = normalizeSearch(a.model);
    const bModel = normalizeSearch(b.model);

    const aMatch =
      aModel === query ||
      aModel.includes(query);

    const bMatch =
      bModel === query ||
      bModel.includes(query);

    if (aMatch && !bMatch) return -1;
    if (bMatch && !aMatch) return 1;

    return 0;
  })
  .slice(
  0,
  expandedTemper === temper.group_id
    ? temper.compatiblePhones.length
    : 15
)
.map((phone) => (

   <button
  key={phone.id}
  onClick={(e) => {
    e.stopPropagation();
    const fullPhone = phones.find(
      (p) => p.id === phone.id
    );

    if (fullPhone) {
      setSelectedPhone(fullPhone);
    }
  }}
  className="px-3 py-1.5 rounded-full bg-[#f3ede4] border border-[#d8c5ad] text-[#6b4428] font-semibold text-sm hover:bg-[#6b4428] hover:text-white transition-all cursor-pointer"
>
  {phone.model}
</button>

                      ))}
                      {temper.compatiblePhones.length > 15 && (
  <div className="mt-4 text-center">
    <span className="text-[#6b4428] text-sm font-semibold">
      {expandedTemper === temper.group_id
        ? "Show Less ↑"
        : `Show All ${temper.compatiblePhones.length} Compatible Phones ↓`}
    </span>
  </div>
)}

                  </div>

                </div>

              </div>

            </div>

          </motion.div>

        ))

    ) : (

      <div className="text-center mt-20">

        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          😭 No Temper Found
        </h2>

        <p className="text-gray-400 text-xl">
          Try another phone model 💀
        </p>

      </div>

    )

  )}

</div>

      {/* POPUP */}


{/* SHOPPING CART DRAWER */}

{showCartDrawer && (
  <div
    className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm"
    onClick={() => setShowCartDrawer(false)}
  >
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ duration: 0.25 }}
      onClick={(e) => e.stopPropagation()}
      className="flex h-full w-full max-w-md flex-col bg-[#fbf8f3] shadow-2xl"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[#e8dfd3] p-5">
        <div>
          <h2 className="text-xl font-bold text-[#171513]">
            🛒 Your Shopping Cart
          </h2>
          <p className="mt-1 text-sm text-[#766b60]">
            {cart.reduce(
              (total, item) => total + item.quantity,
              0
            )} items in your cart
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCartDrawer(false)}
          aria-label="Close shopping cart"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1e8dc] text-xl text-[#6b4428] hover:bg-[#e8dfd3]"
        >
          ✕
        </button>
      </div>

      {/* CART ITEMS */}
      <div className="flex-1 overflow-y-auto p-5">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="text-6xl">🛍️</span>
            <h3 className="mt-4 text-lg font-bold text-[#171513]">
              Your cart is empty
            </h3>
            <p className="mt-2 text-sm text-[#766b60]">
              Add some products to get started.
            </p>
            <button
              type="button"
              onClick={() => setShowCartDrawer(false)}
              className="mt-5 rounded-xl bg-[#805735] px-5 py-3 font-semibold text-white hover:bg-[#684327]"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-2xl border border-[#e8dfd3] bg-white p-3"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="h-20 w-20 shrink-0 rounded-xl bg-[#f7f4ee] object-contain"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#f7f4ee] text-3xl">
                    📦
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-semibold text-[#171513]">
                    {item.product_name}
                  </h3>

                  <p className="mt-1 font-bold text-[#171513]">
                    ₹{(
                      Number(item.sale_price ?? item.price) *
                      item.quantity
                    ).toFixed(2)}
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center rounded-lg border border-[#e8dfd3]">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => {
                          if (item.quantity <= 1) {
                            setCart((currentCart) =>
                              currentCart.filter(
                                (cartItem) => cartItem.id !== item.id
                              )
                            );
                          } else {
                            setCart((currentCart) =>
                              currentCart.map((cartItem) =>
                                cartItem.id === item.id
                                  ? {
                                      ...cartItem,
                                      quantity: cartItem.quantity - 1,
                                    }
                                  : cartItem
                              )
                            );
                          }
                        }}
                        className="px-3 py-1 text-[#6b4428] hover:bg-[#f7f4ee]"
                      >
                        −
                      </button>

                      <span className="min-w-8 text-center text-sm font-semibold text-[#171513]">
                        {item.quantity}
                      </span>

                      
<button
  type="button"
  aria-label="Increase quantity"
  onClick={() => {
    if (item.quantity >= item.stock) {
      setStockLimitMessage(
        `Sorry! Only ${item.stock} units of ${item.product_name} are available.`
      );

      window.setTimeout(() => {
        setStockLimitMessage("");
      }, 3000);

      return;
    }

    setCart((currentCart) =>
      currentCart.map((cartItem) =>
        cartItem.id === item.id
          ? {
              ...cartItem,
              quantity: cartItem.quantity + 1,
            }
          : cartItem
      )
    );
  }}
  className="px-3 py-1 text-[#6b4428] hover:bg-[#f7f4ee]"
>
  +
</button>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCart((currentCart) =>
                          currentCart.filter(
                            (cartItem) => cartItem.id !== item.id
                          )
                        )
                      }
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER / TOTAL */}
      {cart.length > 0 && (
        <div className="border-t border-[#e8dfd3] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#766b60]">
              Subtotal
            </span>
            <span className="text-xl font-bold text-[#171513]">
              ₹
              {cart
                .reduce(
                  (total, item) =>
                    total +
                    Number(item.sale_price ?? item.price) *
                      item.quantity,
                  0
                )
                .toFixed(2)}
            </span>
          </div>

          <p className="mt-1 text-xs text-[#9a8e80]">
            Final pickup details are confirmed at the next step.
          </p>

          <button
            type="button"
            onClick={() => {
              setShowCartDrawer(false);
              setShowPickupCheckout(true);
            }}
            className="mt-4 w-full rounded-xl bg-[#805735] py-3.5 font-bold text-white transition hover:bg-[#684327]"
          >
            Reserve for Pickup →
          </button>

          <button
            type="button"
            onClick={() => setShowCartDrawer(false)}
            className="mt-3 w-full rounded-xl border border-[#e8dfd3] py-3 font-semibold text-[#6b4428] hover:bg-[#fbf8f3]"
          >
            Continue Shopping
          </button>
        </div>
      )}
    </motion.div>
  </div>
)}
      
      {/* PICKUP CHECKOUT */}

{showPickupCheckout && cart.length > 0 && (
  <PickupCheckout
    cart={cart}
    onClose={() => setShowPickupCheckout(false)}
    onOrderCreated={() => {
      console.log("✅ Pickup order created");
    }}
  />
)}

{selectedPhone && (

<div className="fixed inset-0 bg-[#171513]/45 backdrop-blur-md flex items-center justify-center z-50 px-4 overflow-y-auto">
    <motion.div

      initial={{
        opacity: 0,
        scale: 0.7,
        y: 100,
      }}

      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}

      transition={{
        duration: 0.4,
        ease: "easeOut",
      }}

className="relative bg-[#f7f4ee] border border-[#e7e0d5] shadow-[0_25px_70px_rgba(23,21,19,0.25)] rounded-[32px] p-6 md:p-10 w-[95%] max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden"> 
      {/* GLOW */}

<div className="absolute -top-32 -right-32 w-72 h-72 bg-[#b68a4a]/10 blur-3xl rounded-full"></div>
      {/* CLOSE */}

      <button
        onClick={() => setSelectedPhone(null)}
 className="absolute top-5 right-5 w-12 h-12 rounded-full bg-[#eadfD1] hover:bg-[#6b4428] hover:text-white transition text-[#171513] text-2xl z-20"     >
        ✕
      </button>

      <div className="relative z-10">

        <div className="flex flex-col md:flex-row items-center gap-10">

          {/* LEFT SIDE IMAGE */}

<div className="flex justify-center items-center w-full md:w-1/2 min-h-[200px] md:min-h-[300px]">

  <motion.div
    key={phoneImage || selectedPhone?.model}
    initial={{
      scale: 0.2,
      rotateY: 90,
      rotateZ: 15,
      x: 200,
      opacity: 0,
    }}
    animate={{
      scale: 1,
      rotateY: 0,
      rotateZ: 0,
      x: 0,
      opacity: 1,
    }}
    transition={{
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
    }}
    className="relative flex justify-center items-center"
    style={{
      transformStyle: "preserve-3d",
    }}
  >

    <div className="absolute inset-0 bg-[#b68a4a]/15 blur-3xl rounded-full"></div>

<div className="relative z-10 max-h-[300px] md:max-h-[420px] flex items-center justify-center">
      {imageLoading ? (
  <div className="flex flex-col items-center justify-center min-h-[300px]">
    <motion.div
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: "linear",
      }}
      className="w-14 h-14 rounded-full border-4 border-gray-700 border-t-cyan-400"
    />

    <p className="text-gray-400 mt-5 text-sm">
      Loading phone image...
    </p>
  </div>
) : phoneImage ? (
  <img
    src={phoneImage}
    alt={selectedPhone?.model}
className="max-h-[420px] w-auto h-auto object-contain drop-shadow-[0_18px_30px_rgba(75,45,27,0.18)]"  />
) : (
  <div className="flex flex-col items-center justify-center min-h-[300px]">
    <div className="text-6xl mb-4">
      📱
    </div>

    <p className="text-gray-500 text-lg text-center">
      Image coming soon
    </p>
  </div>
)}

    </div>

  </motion.div>

</div>
        
{/* RIGHT SIDE DETAILS */}

          {/* COMPATIBILITY DETAILS */}

<div className="bg-white border border-[#e7e0d5] rounded-3xl p-6 shadow-[0_10px_30px_rgba(75,45,27,0.06)]">
  {/* PHONE MODEL */}

  <div>
    <p className="text-[#9a948c] text-sm mb-1">
      Phone Model
    </p>

    <h3 className="font-premium text-3xl font-semibold text-[#6b4428]">
  {selectedPhone?.model}
</h3>
  </div>


  {/* COMPATIBLE TEMPER */}

  {selectedPhone?.temperedGroups &&
  selectedPhone.temperedGroups.length > 0 ? (

    <div className="mt-6 space-y-4">

{groupedTemperedGroups.map((item, index) => (
        <div
          key={`${item.group_id}-${item.reference_model}-${item.fit}-${index}`}
          className="border border-[#e7e0d5] bg-[#fbf9f5] rounded-2xl p-4"
        >

          <p className="text-[#9a948c] text-sm mb-1">
            Compatible Temper
          </p>

          <h3 className="text-base font-bold text-[#9a7442]">
  {selectedPhone?.model}
</h3>


          {/* FIT QUALITY */}

          <div className="mt-4">

            <p className="text-gray-400 text-sm mb-1">
              Fit Quality
            </p>

            <span className="text-lg font-bold text-[#9a7442]">
  {item.fits.join(", ")}
</span>

          </div>

        </div>

      ))}

    </div>

  ) : (

    <p className="text-gray-500 mt-4">
      No compatible temper found
    </p>

  )}
  
  
</div>


</div>
        {/* BUTTONS */}

        <div className="flex flex-col md:flex-row gap-4 mt-8">

          <button
  type="button"
  onClick={() =>
    setShowCompatibilityInfo(!showCompatibilityInfo)
  }
  className="flex-1 py-4 rounded-2xl bg-[#171513] text-white font-semibold hover:bg-[#6b4428] transition"
>
  Compatible {showCompatibilityInfo ? "⬆️" : "✅"}
</button>


          <button
            onClick={() => setSelectedPhone(null)}
className="flex-1 py-4 rounded-2xl border border-[#6b4428] text-[#6b4428] hover:bg-[#6b4428] hover:text-white transition">
            Close

          </button>

        </div>
        {showCompatibilityInfo && (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    className="mt-4 rounded-2xl border border-[#d8c5ad] bg-[#fbf9f5] p-5"
  >
    <p className="text-lg font-bold text-[#6b4428]">
      ✅ Yes, this temper is compatible!
    </p>

    <p className="text-[#6f6860] mt-2 leading-relaxed">
  The{" "}
  <strong>
    {groupedTemperedGroups?.[0]?.reference_model}
  </strong>{" "}
  temper is compatible with your{" "}
  <strong>{selectedPhone?.model}</strong>.
</p>

    <p className="text-[#6f6860] mt-3">
      <strong>Fit Quality:</strong>{" "}
      {groupedTemperedGroups?.[0]?.fits?.join(", ") || "Compatible"}
    </p>
  </motion.div>
)}


      </div>

    </motion.div>

  </div>
  

)}
<footer className="mt-20 border-t border-gray-800 pt-10 pb-6 text-center">

  <h2 className="text-2xl font-bold text-cyan-400 mb-3">
    M.M TIMES & MOBILES
  </h2>

  <p className="text-gray-400 mb-4">
    Smart Compatibility Checker for Temper Glass & Back Cases
  </p>

  <div className="flex justify-center gap-6 text-gray-500 text-sm flex-wrap">

    <p>📱 Premium Devices</p>

    <p>🛡 Temper Protection</p>

    <p>✨ Perfect Fit Cases</p>

  </div>

  <p className="text-gray-600 text-sm mt-6">
    © 2026 M.M TIMES. All rights reserved.
  </p>
  
</footer>
          </div>
  
         </>
  </LayoutGroup>
  );
  
}