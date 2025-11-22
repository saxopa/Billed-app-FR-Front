/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH }  from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"

// Mock du store
jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Configuration du localStorage
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: 'employee@test.com'
    }))
    
    // Configuration du DOM
    const html = NewBillUI()
    document.body.innerHTML = html
  })

  describe("When I am on NewBill Page", () => {
    test("Then the form should be displayed with all fields", () => {
      // Vérification de la présence du formulaire
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
      expect(screen.getByTestId("expense-type")).toBeTruthy()
      expect(screen.getByTestId("expense-name")).toBeTruthy()
      expect(screen.getByTestId("datepicker")).toBeTruthy()
      expect(screen.getByTestId("amount")).toBeTruthy()
      expect(screen.getByTestId("vat")).toBeTruthy()
      expect(screen.getByTestId("pct")).toBeTruthy()
      expect(screen.getByTestId("commentary")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
    })
    //fin de test

    test("Then mail icon in vertical layout should be highlighted", async () => {
      // Créer et configurer le root AVANT d'appeler router()
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.innerHTML = '' // Nettoyer d'abord
      document.body.append(root)
      
      // Initialiser le routeur
      router()
      
      // Naviguer vers NewBill
      window.onNavigate(ROUTES_PATH.NewBill)
      
      // Attendre que l'icône soit présente ET visible
      await waitFor(() => {
        const mailIcon = screen.getByTestId('icon-mail')
        expect(mailIcon).toBeTruthy()
      }, { timeout: 1000 })
      
      // Vérifier la classe active
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.classList.contains('active-icon')).toBe(true)
    })
    //fin de test
  })

  describe("When I upload a file", () => {
    test("Then handleChangeFile should be called", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = window.onNavigate(ROUTES_PATH[pathname]) 
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const fileInput = screen.getByTestId("file")
      
      fileInput.addEventListener("change", handleChangeFile)
      fireEvent.change(fileInput, {
        target: {
          files: [new File(["image"], "test.png", { type: "image/png" })],
        },
      })

      expect(handleChangeFile).toHaveBeenCalled()
    })

    test("Then a valid image file (png) should be accepted", async () => {
      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const fileInput = screen.getByTestId("file")
      const file = new File(["image"], "image.png", { type: "image/png" })

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      fileInput.addEventListener("change", handleChangeFile)
      
      userEvent.upload(fileInput, file)

      await waitFor(() => expect(handleChangeFile).toHaveBeenCalled())
      expect(fileInput.files[0]).toStrictEqual(file)
      expect(fileInput.files[0].name).toBe("image.png")
    })

    test("Then a valid image file (jpg) should be accepted", async () => {
      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const fileInput = screen.getByTestId("file")
      const file = new File(["image"], "image.jpg", { type: "image/jpeg" })

      userEvent.upload(fileInput, file)

      await waitFor(() => expect(fileInput.files[0].name).toBe("image.jpg"))
    })

    test("Then a valid image file (jpeg) should be accepted", async () => {
      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const fileInput = screen.getByTestId("file")
      const file = new File(["image"], "image.jpeg", { type: "image/jpeg" })

      userEvent.upload(fileInput, file)

      await waitFor(() => expect(fileInput.files[0].name).toBe("image.jpeg"))
    })

    test("Then an invalid file format should show an alert and clear the input", () => {
      window.alert = jest.fn()
      
      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const fileInput = screen.getByTestId("file")
      const file = new File(["document"], "document.pdf", { type: "application/pdf" })

      userEvent.upload(fileInput, file)

      expect(window.alert).toHaveBeenCalledWith('Seuls les fichiers JPG, JPEG ou PNG sont autorisés.')
      expect(fileInput.value).toBe('')
    })

    test("Then fileUrl and billId should be updated after successful upload", async () => {
      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const fileInput = screen.getByTestId("file")
      const file = new File(["image"], "test.png", { type: "image/png" })

      userEvent.upload(fileInput, file)

      await waitFor(() => {
        expect(newBill.billId).toBeTruthy()
        expect(newBill.fileUrl).toBeTruthy()
        expect(newBill.fileName).toBe("test.png")
      })
    })

    test("Then it should handle update errors", async () => {
  console.error = jest.fn()

  //nous voulons mocker la méthode `bills` de mockStore pour qu'elle retourne un objet avec `update` qui rejette.

jest.spyOn(mockStore, 'bills').mockImplementationOnce(() => ({
  create: jest.fn(() => Promise.reject(new Error("Erreur 404"))),
  update: jest.fn(() => Promise.reject(new Error("Erreur 404")))
}))

  const newBill = new NewBill({
    document,
    onNavigate,
    store : mockStore,
    localStorage: window.localStorage
  })

      const fileInput = screen.getByTestId("file")
      const file = new File(["image"], "test.png", { type: "image/png" })

      userEvent.upload(fileInput, file)

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled()
      })
    })
  })

  describe("When I submit the form", () => {
    test("Then handleSubmit should be called", () => {
      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const form = screen.getByTestId("form-new-bill")
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)

      expect(handleSubmit).toHaveBeenCalled()
    })

    test("Then it should create a bill with correct data", () => {
      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      // Simuler le téléchargement d'un fichier
      newBill.fileName = "test.png"
      newBill.fileUrl = "https://test.com/test.png"
      newBill.billId = "1234"

      // Remplir le formulaire
      screen.getByTestId("expense-type").value = "Transports"
      screen.getByTestId("expense-name").value = "Vol Paris-Londres"
      screen.getByTestId("datepicker").value = "2024-04-04"
      screen.getByTestId("amount").value = "348"
      screen.getByTestId("vat").value = "70"
      screen.getByTestId("pct").value = "20"
      screen.getByTestId("commentary").value = "Commentaire de test"

      const updateBill = jest.fn(newBill.updateBill)
      newBill.updateBill = updateBill

      const form = screen.getByTestId("form-new-bill")
      fireEvent.submit(form)

      expect(updateBill).toHaveBeenCalled()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills'])
    })

    test("Then it should handle missing pct value with default 20", () => {
      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      newBill.fileName = "test.png"
      newBill.fileUrl = "https://test.com/test.png"

      screen.getByTestId("expense-type").value = "Transports"
      screen.getByTestId("expense-name").value = "Test"
      screen.getByTestId("datepicker").value = "2024-04-04"
      screen.getByTestId("amount").value = "100"
      screen.getByTestId("vat").value = "20"
      screen.getByTestId("pct").value = ""

      const updateBill = jest.fn(newBill.updateBill)
      newBill.updateBill = updateBill

      const form = screen.getByTestId("form-new-bill")
      fireEvent.submit(form)

      expect(updateBill).toHaveBeenCalledWith(
        expect.objectContaining({
          pct: 20
        })
      )
    })
  })

  describe("When I submit the form and updateBill is called", () => {
    test("Then it should call store.bills().update()", async () => {
      const onNavigate = jest.fn()
      const store = {
        bills: jest.fn(() => ({
          update: jest.fn(() => Promise.resolve())
        }))
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage
      })

      const bill = {
        email: "employee@test.com",
        type: "Transports",
        name: "Test",
        amount: 100,
        date: "2024-04-04",
        vat: "20",
        pct: 20,
        commentary: "Test",
        fileUrl: "https://test.com/test.png",
        fileName: "test.png",
        status: "pending"
      }

      await newBill.updateBill(bill)

      expect(store.bills).toHaveBeenCalled()
    })

    test("Then it should handle update errors", async () => {
      console.error = jest.fn()
      
      const onNavigate = jest.fn()
      mockStore.mockImplementationOnce(()=> ( {
        bills: jest.fn(() => ({
          update: jest.fn(() => Promise.reject(new Error("Update failed")))
        }))
      })
      ) 

      const newBill = new NewBill({
        document,
        onNavigate,
        store : mockStore,
        localStorage: window.localStorage
      })

      const bill = {
        email: "employee@test.com",
        type: "Transports",
        name: "Test",
        amount: 100,
        date: "2024-04-04",
        vat: "20",
        pct: 20,
        commentary: "Test",
        fileUrl: "https://test.com/test.png",
        fileName: "test.png",
        status: "pending"
      }

      await newBill.updateBill(bill)

      expect(store.bills().update).toHaveBeenCalled()
    })
  })
})

// Tests d'intégration
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to NewBill page", () => {
    test("Then it should render NewBill page", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getAllByText("Envoyer une note de frais"))
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy()
    })
  })

  describe("When I submit a new bill", () => {
    test("Then it should create a new bill via POST request", async () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[ pathname ]
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      // Simuler l'upload du fichier
      const fileInput = screen.getByTestId("file")
      const file = new File(["image"], "test.png", { type: "image/png" })
      
      userEvent.upload(fileInput, file)

      await waitFor(() => {
        expect(newBill.billId).toBeTruthy()
        expect(newBill.fileUrl).toBeTruthy()
      })

      // Remplir et soumettre le formulaire
      const form = screen.getByTestId("form-new-bill")
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } })
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Vol Paris-Londres" } })
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2024-04-04" } })
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "348" } })
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "70" } })
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } })
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: "Test" } })

      fireEvent.submit(form)

     await waitFor(() => {
  expect(screen.getByText(/Mes notes de frais/i)).toBeVisible()
})
    })

    test("Then it should handle 404 error from API", async () => {
      mockStore.bills = jest.fn()
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => Promise.reject(new Error("Erreur 404")),
          update: () => Promise.reject(new Error("Erreur 404"))
        }
      })

      const html = NewBillUI()
      document.body.innerHTML = html

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[ pathname ]
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      console.error = jest.fn()

      const fileInput = screen.getByTestId("file")
      const file = new File(["image"], "test.png", { type: "image/png" })
      
      userEvent.upload(fileInput, file)

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled()
      })
    })

    test("Then it should handle 500 error from API", async () => {
      mockStore.bills = jest.fn()
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => Promise.reject(new Error("Erreur 500")),
          update: () => Promise.reject(new Error("Erreur 500"))
        }
      })

      const html = NewBillUI()
      document.body.innerHTML = html

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[ pathname ]
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      console.error = jest.fn()

      const fileInput = screen.getByTestId("file")
      const file = new File(["image"], "test.png", { type: "image/png" })
      
      userEvent.upload(fileInput, file)

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled()
      })
    })
  })
})